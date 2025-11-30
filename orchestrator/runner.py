# orchestrator/runner.py
import asyncio
import json
import hashlib
from typing import Any, Dict, List, Optional
import httpx
from jinja2 import Environment, StrictUndefined
from datetime import datetime

# If your call_mcp_tool is in main.py, import it. Otherwise copy the implementation here.
# from main import call_mcp_tool, MCP_ENDPOINT
# To avoid circular imports, we will accept a client and an MCP_ENDPOINT parameter.

env = Environment(undefined=StrictUndefined)  # fail fast if template refers to missing keys

def canonical_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def compute_receipt(run_log: Dict[str, Any]) -> str:
    c = canonical_json(run_log)
    return hashlib.sha256(c.encode("utf-8")).hexdigest()

async def _call_tool_with_client(client: httpx.AsyncClient, base_url: str, tool: str, args: dict):
    url = f"{base_url}/tool/{tool}"
    try:
        resp = await client.post(url, json=args, timeout=30.0)
        resp.raise_for_status()
        return resp.json()
    except httpx.ConnectError as e:
        raise RuntimeError(f"ConnectError to MCP {url}: {e}")
    except httpx.HTTPStatusError as e:
        body = e.response.text if e.response is not None else ""
        raise RuntimeError(f"MCP HTTPError {e.response.status_code} for {url}: {body}")
    except Exception as e:
        raise RuntimeError(f"Error calling MCP tool {tool}: {e}")

def render_args_template(raw_args: Any, context: Dict[str, Any]) -> Any:
    """
    Recursively render Jinja2 templates in raw_args (which may be dict/list/str).
    Strings are treated as templates if they contain '{{' and '}}'.
    """
    if isinstance(raw_args, str):
        if "{{" in raw_args and "}}" in raw_args:
            template = env.from_string(raw_args)
            return template.render(**context)
        else:
            return raw_args
    if isinstance(raw_args, dict):
        out = {}
        for k, v in raw_args.items():
            out[k] = render_args_template(v, context)
        return out
    if isinstance(raw_args, list):
        return [render_args_template(x, context) for x in raw_args]
    return raw_args  # numbers, booleans, None

async def execute_plan(plan: Dict[str, Any],
                       manifest: Dict[str, Any],
                       prompt: str,
                       user: str,
                       client: httpx.AsyncClient,
                       mcp_endpoint: str,
                       abort_on_error: bool = True,
                       timeout_per_tool: int = 30) -> Dict[str, Any]:
    """
    Execute the given plan sequentially.
    Returns run_result = {
      "manifest_id": ...,
      "prompt": ...,
      "user": ...,
      "started_at": "...",
      "steps": [ { "index":0, "tool": "...", "args": {...}, "status":"ok"/"error", "result": {...}, "error":"message" } ],
      "ended_at": "...",
      "receipt": "sha256..."
    }
    """
    run = {
        "manifest_id": manifest.get("id"),
        "prompt": prompt,
        "user": user,
        "started_at": datetime.utcnow().isoformat() + "Z",
        "steps": [],
    }

    # context available to templates: steps (list), last (last step's result), manifest, prompt, user
    context = {
        "steps": [],  # will be filled with step outputs as executed
        "last": {},
        "manifest": manifest,
        "prompt": prompt,
        "user": user,
    }

    steps = plan.get("steps", [])
    for idx, step in enumerate(steps):
        tool = step.get("tool")
        raw_args = step.get("args", {}) or {}
        step_record = {"index": idx, "tool": tool, "args": raw_args, "status": "pending", "result": None, "error": None}
        run["steps"].append(step_record)

        try:
            # Render args with current context
            rendered_args = render_args_template(raw_args, context)

            # Convert numeric strings that should be numbers? Leave as is - tools should accept JSON text types.
            # Call tool via HTTP client
            try:
                if tool == "answer_user":
                    # Local tool: just return the answer
                    result = {"content": [{"type": "text", "text": rendered_args.get("answer", "")}]}
                else:
                    result = await _call_tool_with_client(client, mcp_endpoint, tool, rendered_args)
            except Exception as e:
                raise

            # Record result
            step_record["args"] = rendered_args
            step_record["status"] = "ok"
            step_record["result"] = result

            # Update context: push simplified representation to steps for templating
            # Keep entire result under steps[idx] so templates can reference it
            simple = {
                "tool": tool,
                "args": rendered_args,
                "result": result
            }
            context["steps"].append(simple)
            context["last"] = simple

        except Exception as e:
            err_msg = str(e)
            step_record["status"] = "error"
            step_record["error"] = err_msg
            step_record["result"] = None
            # If abort_on_error, stop execution and produce receipt of what ran so far
            if abort_on_error:
                run["ended_at"] = datetime.utcnow().isoformat() + "Z"
                # compute receipt for partial run
                run_log_for_receipt = {k: run[k] for k in ("manifest_id","prompt","user","steps","started_at","ended_at")}
                receipt = compute_receipt(run_log_for_receipt)
                run["receipt"] = receipt
                return run
            else:
                # continue to next step with error recorded
                context["steps"].append({"tool": tool, "args": raw_args, "result": {"error": err_msg}})
                context["last"] = {"tool": tool, "args": raw_args, "result": {"error": err_msg}}
                continue

    run["ended_at"] = datetime.utcnow().isoformat() + "Z"
    run_log_for_receipt = {k: run[k] for k in ("manifest_id","prompt","user","steps","started_at","ended_at")}
    run["receipt"] = compute_receipt(run_log_for_receipt)
    return run
