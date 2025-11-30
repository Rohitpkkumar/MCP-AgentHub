"""
orchestrator/llm_adapter.py

Provides a single function plan_with_llm(manifest, prompt, context_snippets, provider=None)
that returns a dict with "steps": [ { "tool": str, "args": { ... } }, ... ].

Defaults to a deterministic STUB provider (safe offline).
Optionally supports OpenAI if LLM_PROVIDER=openai and OPENAI_API_KEY is set.

This file intentionally avoids heavy dependencies; OpenAI usage is guarded and optional.
"""

import os
import json
import time
from typing import Any, Dict, List, Optional
import requests, time
from .llm_utils import validate_llm_plan


# If you want stronger validation, import pydantic and define models.
# We keep this minimal so it plugs into your orchestrator easily.

DEFAULT_PROVIDER = os.getenv("LLM_PROVIDER", "stub").lower()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Safe default list of allowed tool names (the orchestrator and MCP should still enforce)
ALLOWED_TOOLS = ["search_docs", "create_ticket", "call_api", "send_email", "call_agent"]

# ---------- Helpers ----------
def _normalize_manifest(manifest: Any) -> Dict[str, Any]:
    # ensure manifest is a plain dict we can introspect
    if isinstance(manifest, dict):
        return manifest
    # For ic-py outputs you may sometimes have custom types; try str-cast
    try:
        return json.loads(json.dumps(manifest))
    except Exception:
        return {"id": str(manifest)}

def _validate_plan_shape(plan: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensure plan is a dict containing 'steps' (list of dicts with 'tool' and 'args').
    If invalid, raise ValueError.
    """
    if not isinstance(plan, dict):
        raise ValueError("plan must be a JSON object")
    steps = plan.get("steps")
    if not isinstance(steps, list):
        raise ValueError("plan missing 'steps' list")
    for i, s in enumerate(steps):
        if not isinstance(s, dict):
            raise ValueError(f"plan step {i} must be an object")
        if "tool" not in s or "args" not in s:
            raise ValueError(f"plan step {i} missing 'tool' or 'args'")
        if s["tool"] not in ALLOWED_TOOLS:
            # we only warn here; orchestrator safety checks should enforce final policy
            # but to be conservative, we can raise or coerce.
            raise ValueError(f"tool '{s['tool']}' is not in allowed list {ALLOWED_TOOLS}")
    return plan

# ---------- STUB provider ----------
def _stub_plan(manifest: Dict[str, Any], prompt: str, context_snippets: Optional[List[Dict[str, Any]]]) -> Dict[str, Any]:
    """
    Deterministic stub planner for offline testing.
    It produces a simple plan: search_docs -> create_ticket, and uses the prompt.
    """
    # Basic sanitization
    manifest = _normalize_manifest(manifest)
    # Use context snippets if present to build a better ticket body
    snippet_texts = []
    if context_snippets:
        for s in context_snippets[:3]:
            snippet_texts.append(s.get("snippet") or s.get("text") or "")
    snippet_block = "\n".join(snippet_texts).strip()
    ticket_body = f"User prompt: {prompt}\n\n"
    if snippet_block:
        ticket_body += f"Relevant snippets:\n{snippet_block}\n"
    else:
        ticket_body += "No relevant snippets found."

    plan = {
        "steps": [
            {"tool": "search_docs", "args": {"query": prompt, "k": 3}},
            {"tool": "create_ticket", "args": {"title": f"Auto-ticket: {prompt[:60]}", "body": ticket_body, "priority": "normal"}}
        ]
    }
    # deterministic metadata
    plan["_meta"] = {"provider": "stub", "generated_at": int(time.time())}
    validate_llm_plan(plan)
    return plan

# ---------- OpenAI provider ----------
def _openai_plan(manifest: Dict[str, Any], prompt: str, context_snippets: Optional[List[Dict[str, Any]]]) -> Dict[str, Any]:
    from openai import OpenAI

    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not set in the environment")

    client = OpenAI(api_key=OPENAI_API_KEY)

    # Build context for the prompt
    context_text = ""
    if context_snippets:
        parts = []
        for s in context_snippets[:5]:
            snip = s.get("snippet") or s.get("text") or ""
            if snip:
                parts.append(snip.strip())
        if parts:
            context_text = "\n\n".join(parts)

    system_prompt = (
        "You are a planner that converts a user's natural-language request into a "
        "structured plan composed of tool calls. Return STRICT JSON only."
    )

    user_prompt = (
        f"Manifest: {json.dumps(manifest, ensure_ascii=False)}\n\n"
        f"Context snippets (if any):\n{context_text}\n\n"
        f"User request: {prompt}\n\n"
        "Return a JSON object with a single key 'steps' which is a list of objects:\n"
        "{\"tool\":\"search_docs\",\"args\":{\"query\":\"...\",\"k\":3}}, ...\n"
        "Allowed tools: search_docs, create_ticket, call_api, send_email.\n"
        "Return STRICT JSON. No explanation."
    )

    try:
        resp = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=600,
        )
    except Exception as e:
        raise RuntimeError(f"OpenAI API error: {e}")

    text = resp.choices[0].message.content.strip()

    # attempt to parse JSON
    try:
        plan = json.loads(text)
    except Exception:
        # try extracting JSON substring
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            try:
                plan = json.loads(text[start:end + 1])
            except Exception:
                raise RuntimeError(f"Invalid JSON from model: {text}")
        else:
            raise RuntimeError(f"OpenAI did not return JSON: {text}")

    _validate_plan_shape(plan)
    plan["_meta"] = {"provider": "openai", "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini")}
    validate_llm_plan(plan)
    return plan


# ---------- Public entrypoint ----------
def plan_with_llm(manifest: Any, prompt: str, context_snippets: Optional[List[Dict[str, Any]]] = None, provider: Optional[str] = None) -> Dict[str, Any]:
    """
    Main entrypoint. Choose provider via argument, env LLM_PROVIDER or default 'stub'.
    Returns a dict with 'steps': [...]
    Raises RuntimeError or ValueError on failure.
    """
    if provider is None:
        provider = DEFAULT_PROVIDER
    provider = provider.lower()

    manifest_dict = _normalize_manifest(manifest)
    # ensure prompt sanity
    prompt_text = str(prompt or "").strip()
    if not prompt_text:
        raise ValueError("prompt must be a non-empty string")

    if provider in ("stub", "mock", "none"):
        plan = _stub_plan(manifest_dict, prompt_text, context_snippets)
        # validate shape before returning
        try:
            _validate_plan_shape(plan)
        except Exception as e:
            raise RuntimeError(f"Stub produced invalid plan: {e}")
        return plan

    if provider == "openai":
        return _openai_plan(manifest_dict, prompt_text, context_snippets)

    if provider in ("hf", "huggingface"):
        return _hf_plan(manifest_dict, prompt_text, context_snippets)

    if provider == "groq":
        return _groq_plan(manifest_dict, prompt_text, context_snippets)

    raise RuntimeError(f"Unknown LLM provider '{provider}'. Supported: stub, openai.")



# ----- add this HF provider helper somewhere near other providers -----
HF_API_KEY = os.getenv("HF_API_KEY", "")
HF_MODEL = os.getenv("HF_MODEL", "meta-llama/Llama-4-Scout-17B-16E")
HF_INFERENCE_URL_TEMPLATE = "https://router.huggingface.co/hf-inference/v1/models/{model}"

def _hf_plan(manifest: Dict[str, Any], prompt: str, context_snippets: Optional[List[Dict[str, Any]]]) -> Dict[str, Any]:
    """
    Call Hugging Face Inference API (serverless) for text generation.
    Expects HF_API_KEY env var. Returns parsed plan (same shape as stub/openai).
    """
    if not HF_API_KEY:
        raise RuntimeError("HF_API_KEY not set in environment")

    # Compose a strict JSON-only instruction to the model so it returns JSON plan
    # Use the short prompt template; include context snippets if present
    ctx = ""
    if context_snippets:
        ctx_parts = [s.get("snippet") or s.get("text") or "" for s in context_snippets[:5]]
        ctx = "\n\n".join([p for p in ctx_parts if p])

    user_instr = (
        "Return strict JSON only. Produce an object with key 'steps' which is a list of "
        "objects {\"tool\": string, \"args\": object}. Allowed tools: search_docs, create_ticket, call_api, send_email.\n\n"
        f"Context snippets:\n{ctx}\n\nUser request: {prompt}\n\n"
        "Example: {\"steps\":[{\"tool\":\"search_docs\",\"args\":{\"query\":\"...\",\"k\":3}},"
        "{\"tool\":\"create_ticket\",\"args\":{\"title\":\"...\",\"body\":\"...\",\"priority\":\"normal\"}}]}"
    )

    # HF Inference expects application/json with {"inputs": "...", "parameters": {...}}
    url = HF_INFERENCE_URL_TEMPLATE.format(model=HF_MODEL)
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    payload = {"inputs": user_instr, "parameters": {"max_new_tokens": 600, "temperature": 0.2}}

    # Make request (serverless inference)
    r = requests.post(url, headers=headers, json=payload, timeout=60)
    if r.status_code != 200:
        raise RuntimeError(f"Hugging Face inference error {r.status_code}: {r.text}")

    # HF returns JSON; models sometimes return nested formats. Extract text.
    resp_json = r.json()
    # Many models return a list of generations: [{"generated_text":"..."}] or [{"generated_text": "..."}]
    if isinstance(resp_json, list) and len(resp_json) > 0 and isinstance(resp_json[0], dict):
        # try common shapes
        if "generated_text" in resp_json[0]:
            text = resp_json[0]["generated_text"]
        elif "generated_texts" in resp_json[0]:  # fallback
            text = resp_json[0]["generated_texts"][0]
        else:
            # sometimes the API returns {"error": "..."} or a different structure
            text = json.dumps(resp_json)
    elif isinstance(resp_json, dict) and "generated_text" in resp_json:
        text = resp_json["generated_text"]
    else:
        # fallback: stringify whole response
        text = json.dumps(resp_json)

    text = text.strip()
    # Attempt to parse JSON plan out of the model text
    try:
        plan = json.loads(text)
    except Exception:
        # Extract first JSON object substring
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                plan = json.loads(text[start:end+1])
            except Exception as e:
                raise RuntimeError(f"Failed to parse JSON from HF model output. Raw output: {text}") from e
        else:
            raise RuntimeError(f"Failed to parse JSON from HF model output. Raw output: {text}")

    # Validate shape
    _validate_plan_shape(plan)
    plan["_meta"] = {"provider": "hf", "model": HF_MODEL, "generated_at": int(time.time())}
    validate_llm_plan(plan)
    return plan

# ----- modify plan_with_llm to support 'hf' provider (add near existing provider branches) -----
    if provider == "hf" or provider == "huggingface":
        return _hf_plan(manifest_dict, prompt_text, context_snippets)


# ---------- GROQ provider (OpenAI-compatible) ----------
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

def _groq_plan(manifest: Dict[str, Any], prompt: str, context_snippets: Optional[List[Dict[str, Any]]]):
    """
    Uses Groq (OpenAI-compatible) to generate strict JSON tool plans.
    This is FREE and super fast (Llama-3.1 models).
    """
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not set")

    from openai import OpenAI
    client = OpenAI(api_key=GROQ_API_KEY, base_url=GROQ_BASE_URL)

    # Build context
    context_text = ""
    if context_snippets:
        parts = []
        for s in context_snippets[:5]:
            snip = s.get("snippet") or s.get("text") or ""
            if snip:
                parts.append(snip.strip())
        if parts:
            context_text = "\n\n".join(parts)

    system_prompt = (
        "You are a planner that converts a user's task into a JSON plan of tool calls. "
        "Return STRICT JSON only — no explanations."
    )

    user_prompt = (
        f"Manifest: {json.dumps(manifest, ensure_ascii=False)}\n\n"
        f"Context:\n{context_text}\n\n"
        f"User request:\n{prompt}\n\n"
        "Your output MUST be only a JSON object with a 'steps' array containing items like:\n"
        "{\"tool\":\"search_docs\",\"args\":{\"query\":\"...\",\"k\":3}}\n"
        "Allowed tools: search_docs, create_ticket, call_api, send_email."
    )

    try:
        resp = client.chat.completions.create(
            model=GROQ_MODEL,
            temperature=0.2,
            max_tokens=600,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]
        )
    except Exception as e:
        raise RuntimeError(f"Groq API error: {e}")

    text = resp.choices[0].message.content.strip()

    # Parse JSON
    try:
        plan = json.loads(text)
    except Exception:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            plan = json.loads(text[start:end+1])
        else:
            raise RuntimeError(f"Groq returned non-JSON: {text}")

    _validate_plan_shape(plan)
    plan["_meta"] = {"provider": "groq", "model": GROQ_MODEL}
    validate_llm_plan(plan)
    return plan


def discover_and_plan(agents: List[Dict[str, Any]], prompt: str, messages: Optional[List[Dict[str, str]]] = None, provider: str = "groq") -> Dict[str, Any]:
    """
    1. Summarize available agents.
    2. Ask LLM to select relevant agents and generate a plan.
    """
    
    agent_summaries = []
    for ag in agents:
        # minimal summary to save tokens
        s = (
            f"- ID: {ag.get('id')}\n"
            f"  Name: {ag.get('name')}\n"
            f"  Description: {ag.get('description')}\n"
            f"  Tools: {ag.get('allowed_tools')}\n"
            f"  Endpoint: {ag.get('endpoint')}\n"
        )
        agent_summaries.append(s)
    
    agents_block = "\n".join(agent_summaries)

    # Format conversation history
    history_block = ""
    if messages:
        # Take last 5 messages to save context window
        recent = messages[-5:]
        history_lines = []
        for m in recent:
            role = m.get("role", "user")
            content = m.get("content", "")
            history_lines.append(f"{role.upper()}: {content}")
        history_block = "\n".join(history_lines)

    system_prompt = (
        "You are an intelligent orchestrator. Your goal is to help the user by selecting the best available agents "
        "and creating a execution plan. \n"
        "You have access to a registry of agents. Each agent has an ID, description, and endpoint.\n"
        "To use an agent, you MUST generate a 'call_agent' tool step.\n"
        "If NO agent is suitable for the task, OR if you can answer the user's question directly using general knowledge (e.g. 'What is the capital of France?', 'Who is the president of US?'), you MUST return a plan with a single step using the 'answer_user' tool.\n"
        "DO NOT use search agents for simple general knowledge questions.\n"
        "Return STRICT JSON only."
    )

    user_prompt = (
        f"Available Agents:\n{agents_block}\n\n"
        f"Conversation History:\n{history_block}\n\n"
        f"User Request: {prompt}\n\n"
        "Create a plan to fulfill the request. \n"
        "If the request requires external data or specific actions (e.g. 'Search for latest news', 'Send email'), use the relevant agent via 'call_agent'.\n"
        "If multiple agents are needed, chain them.\n"
        "If the request is a general knowledge question or simple conversation, use 'answer_user'.\n\n"
        "Output Format (JSON):\n"
        "{\n"
        "  \"steps\": [\n"
        "    {\n"
        "      \"tool\": \"call_agent\",\n"
        "      \"args\": {\n"
        "        \"endpoint\": \"<AGENT_ENDPOINT>\",\n"
        "        \"path\": \"/execute\",\n"
        "        \"method\": \"POST\",\n"
        "        \"payload\": { \"prompt\": \"<INSTRUCTION_FOR_AGENT>\" }\n"
        "      }\n"
        "    }\n"
        "  ]\n"
        "}\n"
        "OR if answering directly:\n"
        "{\n"
        "  \"steps\": [\n"
        "    {\n"
        "      \"tool\": \"answer_user\",\n"
        "      \"args\": {\n"
        "        \"answer\": \"<YOUR_ANSWER_HERE>\"\n"
        "      }\n"
        "    }\n"
        "  ]\n"
        "}\n"
        "IMPORTANT: The 'payload' in 'call_agent' must contain a 'prompt' field with specific instructions for that agent.\n"
        "IMPORTANT: Use the Conversation History to resolve coreferences (e.g. 'he', 'it', 'that'). The 'prompt' sent to the agent MUST be self-contained and explicit."
    )

    if not GROQ_API_KEY:
         # Fallback to stub if no key (shouldn't happen given the task)
         print("[orchestrator] No GROQ_API_KEY, returning stub plan.")
         return _stub_plan({}, prompt, None)

    from openai import OpenAI
    client = OpenAI(api_key=GROQ_API_KEY, base_url=GROQ_BASE_URL)

    try:
        resp = client.chat.completions.create(
            model=GROQ_MODEL,
            temperature=0.2,
            max_tokens=1000,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]
        )
    except Exception as e:
        raise RuntimeError(f"Groq Discovery API error: {e}")

    text = resp.choices[0].message.content.strip()
    
    # Parse JSON
    try:
        plan = json.loads(text)
    except Exception:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            plan = json.loads(text[start:end+1])
        else:
            raise RuntimeError(f"Groq returned non-JSON: {text}")

    # Basic validation
    if "steps" not in plan:
        raise ValueError("Plan missing 'steps'")
    
    plan["_meta"] = {"provider": "groq-discovery", "model": GROQ_MODEL}
    return plan
