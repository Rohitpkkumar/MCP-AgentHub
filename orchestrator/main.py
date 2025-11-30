# orchestrator/main.py
from dotenv import load_dotenv
import os
from pathlib import Path

# Load .env from the same directory as this file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

import os
import json
import hashlib
from typing import Any, Dict, List, Optional
from orchestrator.llm_adapter import plan_with_llm, discover_and_plan
from orchestrator.llm_utils import validate_llm_plan

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from nacl.signing import VerifyKey
from nacl.encoding import HexEncoder
from ic.candid import Types, encode, decode


from orchestrator.runner import execute_plan



# ic-py
from ic.client import Client
from ic.identity import Identity
from ic.agent import Agent
from ic.canister import Canister
from ic.principal import Principal as ICPrincipal

import httpx
from httpx import ConnectError, HTTPStatusError, TimeoutException

REQUIRE_SIGNATURE = os.getenv("REQUIRE_SIGNATURE", "false").lower() in ("1","true","yes")


# ====== Configuration (edit paths if your layout differs) ======
IC_HOST = os.getenv("IC_HOST", "http://127.0.0.1:4943")
DFX_IDS_PATH = os.getenv("DFX_IDS_PATH", "../canisters/registery/.dfx/local/canister_ids.json")
REGISTRY_DID_PATH = os.getenv("REGISTRY_DID_PATH", "../canisters/registery/registry_backend/registry_backend.did")
REGISTRY_CANISTER_NAME = os.getenv("REGISTRY_CANISTER_NAME", "registry_backend")
MCP_ENDPOINT = os.getenv("MCP_ENDPOINT", "http://localhost:9000")
# ===============================================================

app = FastAPI(title="MCP Agent Hub — Orchestrator (dev)")

# Allow local frontend access for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_registry_canister: Any | None = None

# Mock Registry for debugging when IC is not reachable
USE_MOCK_REGISTRY = os.getenv("USE_MOCK_REGISTRY", "false").lower() == "true"
MOCK_AGENTS = {}

class MockRegistry:
    async def register_agent_async(self, manifest: dict) -> bool:
        # Simulate canister behavior: store manifest
        # manifest has 'developer' as Principal, convert to string for storage if needed, 
        # but for in-memory we can keep it or serialize it.
        # To match canister behavior (which returns normalized structure on get), 
        # we should probably store a serialized version or keep as is.
        # Let's store as is, but ensure we return what list_agents expects.
        MOCK_AGENTS[manifest["id"]] = manifest
        print(f"[MockRegistry] Registered agent: {manifest['id']}")
        return True

    async def list_agents_async(self) -> List[dict]:
        return list(MOCK_AGENTS.values())

    async def get_agent_async(self, agent_id: str) -> Optional[dict]:
        return MOCK_AGENTS.get(agent_id)

# ----------------- Helper: robust normalization -----------------
def normalize_serialized_manifest(x, expected_id=None):
    """
    Coerce nested candid/python structures into a dict manifest.
    Handles shapes from ic-py like:
      - record {...}
      - [ record {...} ]
      - vec { record {...} } -> becomes list with dict
      - nested lists [[{...}]] etc
      - list-of-pairs [(k,v), ...] -> convert to dict
    Returns a dict (or raises ValueError if no dict found).
    """
    def is_pair_list(lst):
        return all(isinstance(it, (list, tuple)) and len(it) == 2 for it in lst)

    cur = x
    for _ in range(8):  # iterate a few levels to handle nested lists
        # if already a dict
        if isinstance(cur, dict):
            return cur
        # if it's a list/tuple, try unwrap or convert
        if isinstance(cur, (list, tuple)):
            # empty -> not useful
            if len(cur) == 0:
                break
            # single-element wrapper -> unwrap and retry
            if len(cur) == 1:
                cur = cur[0]
                continue
            # list of pairs -> dict
            if is_pair_list(cur):
                try:
                    return {str(k): v for k, v in cur}
                except Exception:
                    pass
            # find direct dict that matches expected_id first
            if expected_id:
                for item in cur:
                    if isinstance(item, dict) and item.get("id") == expected_id:
                        return item
            # find first dict inside
            for item in cur:
                if isinstance(item, dict):
                    return item
            # flatten one level and try again (handles [[...], [...]] cases)
            flattened = []
            for item in cur:
                if isinstance(item, (list, tuple)):
                    flattened.extend(list(item))
                else:
                    flattened.append(item)
            cur = flattened
            continue
        # otherwise, give up
        break
    # if we get here, we couldn't recover to a dict -> error
    raise ValueError(f"Could not normalize manifest shape: {type(x)}. Content preview: {str(x)[:400]}")

# ----------------- Replace /execute route with this (paste entire function) -----------------
@app.post("/execute")
async def execute_agent(request: Request):
    """
    Execute a previously planned sequence (or generate a plan then execute).
    Expects:
      - manifest_id: str
      - prompt: str
      - user: str (principal text)
      - optional: plan: { "steps": [...] }  (if frontend passed it after approval)
      - optional: abort_on_error: bool
    """
    payload = await request.json()
    manifest_id = payload.get("manifest_id")
    prompt = payload.get("prompt", "")
    user_text = payload.get("user", "2vxsx-fae")
    abort_on_error = bool(payload.get("abort_on_error", True))
    provided_plan = payload.get("plan")

    if not manifest_id:
        raise HTTPException(status_code=400, detail="manifest_id required")
    if _registry_canister is None:
        raise HTTPException(status_code=500, detail="Canister not initialized.")

    # Fetch manifest from canister
    try:
        raw_manifest = await _registry_canister.get_agent_async(manifest_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading manifest from canister: {e}")

    if raw_manifest is None:
        raise HTTPException(status_code=404, detail="Agent manifest not found")

    # Serialize and normalize manifest into a dict
    try:
        serialized = py_serialize(raw_manifest)
        # Check for empty/wrapped empty results
        if not serialized or serialized == [[]] or serialized == []:
             raise HTTPException(status_code=404, detail="Agent manifest not found (empty result)")
             
        manifest_dict = normalize_serialized_manifest(serialized, expected_id=manifest_id)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Unexpected manifest shape after serialization: {e}")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to serialize/normalize manifest: {e}")

    # ---- NORMALIZE OPTIONAL FIELDS (unwrap candid/opt shapes) ----
    def _unwrap_opt(v):
        # ic-py/candid often encodes optional vals as [] or [value]
        if isinstance(v, (list, tuple)):
            if len(v) == 0:
                return None
            return v[0]
        return v

    # Unwrap common opt/text fields that came back as lists
    manifest_dict["endpoint"] = _unwrap_opt(manifest_dict.get("endpoint"))
    manifest_dict["health_check"] = _unwrap_opt(manifest_dict.get("health_check"))
    manifest_dict["pubkey"] = _unwrap_opt(manifest_dict.get("pubkey"))
    manifest_dict["manifest_hash"] = _unwrap_opt(manifest_dict.get("manifest_hash"))

    # allowed_tools may come as opt vec -> perhaps [] or ['a','b'] or [['a','b']]
    at = manifest_dict.get("allowed_tools")
    if isinstance(at, (list, tuple)) and len(at) == 1 and isinstance(at[0], (list, tuple)):
        # unwrap double-nested list
        manifest_dict["allowed_tools"] = list(at[0])
    elif isinstance(at, (list, tuple)):
        manifest_dict["allowed_tools"] = list(at)
    else:
        manifest_dict["allowed_tools"] = None if at is None else at

    # developer might already be string from py_serialize; ensure string
    dev = manifest_dict.get("developer")
    if isinstance(dev, (list, tuple)):
        manifest_dict["developer"] = _unwrap_opt(dev)

    # Verification (graded)
    try:
        # Full signature verification (preferred)
        if manifest_dict.get("signature") and manifest_dict.get("pubkey"):
            try:
                verify_manifest_signature(manifest_dict)
            except ValueError as e:
                # signature present but invalid -> reject
                raise HTTPException(status_code=400, detail=f"Invalid manifest signature: {e}")

        # Integrity check via manifest_hash if signature not present
        elif manifest_dict.get("manifest_hash") and manifest_dict.get("pubkey"):
            tmp = {k: v for k, v in manifest_dict.items() if k != "manifest_hash"}
            computed = hashlib.sha256(canonical_json(tmp).encode("utf-8")).hexdigest()
            onchain = str(manifest_dict.get("manifest_hash"))
            if computed != onchain:
                raise HTTPException(status_code=400, detail="Manifest hash mismatch (on-chain manifest may be tampered).")
            else:
                print(f"[orchestrator] warning: manifest {manifest_id} has manifest_hash but no signature. Integrity OK, authenticity not verified.")

        # No signature/hash present — permit in dev but warn (toggle for prod)
        else:
            print(f"[orchestrator] warning: manifest {manifest_id} missing signature and manifest_hash. Proceeding without cryptographic verification.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Manifest verification error: {e}")

    # Get plan: prefer client-provided plan (frontend approval). Otherwise generate.
    plan = None
    if provided_plan:
        plan = provided_plan
    else:
        # Attempt to fetch context snippets from MCP (best-effort)
        context_snippets = None
        try:
            async with httpx.AsyncClient() as tmp_client:
                resp = await tmp_client.post(f"{MCP_ENDPOINT}/tool/search_docs", json={"query": prompt, "k": 3}, timeout=6.0)
                if resp.status_code == 200:
                    context_snippets = resp.json().get("results")
        except Exception:
            context_snippets = None

        # Generate plan via the LLM adapter (synchronous function in your code)
        try:
            plan = plan_with_llm(manifest_dict, prompt, context_snippets)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"LLM planning error: {e}")

    # If plan is a list (older shape), normalize to {"steps": ...}
    if isinstance(plan, list):
        plan = {"steps": plan}
        
    # after plan is generated/assigned and validated
    # If the manifest has endpoint and wants to run agent, append a call_agent step
    if manifest_dict.get("endpoint"):
        # only append if plan doesn't already include agent call
        has_agent_call = any(s.get("tool") == "call_agent" for s in plan.get("steps", []))
        if not has_agent_call:
            endpoint_val = manifest_dict.get("endpoint")
            # if endpoint is still a list for any reason, unwrap it
            if isinstance(endpoint_val, (list, tuple)):
                endpoint_val = endpoint_val[0] if endpoint_val else None

            plan["steps"].append({
                "tool": "call_agent",
                "args": {
                    "endpoint": endpoint_val,
                    "path": "/execute",
                    "method": "POST",
                    "payload": {"prompt": prompt, "user": user_text}
                }
            })


    # Validate plan has steps
    if not isinstance(plan, dict) or "steps" not in plan:
        raise HTTPException(status_code=400, detail="Plan must be an object with key 'steps'")

    # Enforce manifest allowed_tools whitelist if present
    # Enforce manifest allowed_tools whitelist if present
    # Enforce manifest allowed_tools whitelist if present (robust to opt/vec shapes)
    allowed = manifest_dict.get("allowed_tools")
    if allowed is not None:
        # handle shapes like [['search_docs','create_ticket']] (opt/vec flattening)
        if isinstance(allowed, list) and len(allowed) == 1 and isinstance(allowed[0], list):
            allowed = allowed[0]

        if not isinstance(allowed, (list, tuple)):
            raise HTTPException(status_code=400, detail="manifest.allowed_tools must be a list if present")

        # coerce members to plain strings
        normalized_allowed = []
        for t in allowed:
            if isinstance(t, (list, tuple)) and len(t) == 1:
                # handle weird nested singletons
                normalized_allowed.append(str(t[0]))
            else:
                normalized_allowed.append(str(t))

        # if manifest supplies endpoint, implicitly allow call_agent
        if manifest_dict.get("endpoint") and "call_agent" not in normalized_allowed:
            normalized_allowed = normalized_allowed + ["call_agent"]

        bad_tools = [s.get("tool") for s in plan.get("steps", []) if s.get("tool") not in normalized_allowed]
        if bad_tools:
            raise HTTPException(status_code=403, detail=f"Plan requests disallowed tools: {bad_tools}. Allowed: {normalized_allowed}")

    # Validate plan shape using existing validator
    try:
        validate_llm_plan(plan)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid plan provided/generated: {e}")

    # Execute the plan via runner
    try:
        async with httpx.AsyncClient() as client:
            run_result = await execute_plan(
                plan=plan,
                manifest=manifest_dict,
                prompt=prompt,
                user=user_text,
                client=client,
                mcp_endpoint=MCP_ENDPOINT,
                abort_on_error=abort_on_error
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {e}")

    # Best-effort: write audit on-chain if supported
    try:
        user_principal_obj = to_principal(user_text)
        user_principal_text = user_principal_obj.to_str()
        if hasattr(_registry_canister, "write_audit_async"):
            await _registry_canister.write_audit_async(manifest_id, user_principal_text, run_result.get("receipt"))
    except Exception as e:
        print(f"[orchestrator] warning: audit write failed: {e}")

    return JSONResponse(run_result)

# ----------------- Utilities -----------------
def load_canister_id() -> str:
    if not os.path.exists(DFX_IDS_PATH):
        raise FileNotFoundError(f"dfx canister ids file not found at {DFX_IDS_PATH}. Run `dfx start` and `dfx deploy` first.")
    with open(DFX_IDS_PATH, "r") as fh:
        data = json.load(fh)
    try:
        canister_entry = data[REGISTRY_CANISTER_NAME]
        if "local" in canister_entry:
            return canister_entry["local"]
        return list(canister_entry.values())[0]
    except KeyError:
        raise KeyError(f"Canister name '{REGISTRY_CANISTER_NAME}' not found in {DFX_IDS_PATH}.")

def py_serialize(obj: Any) -> Any:
    if isinstance(obj, ICPrincipal):
        return obj.to_str()
    if isinstance(obj, (bytes, bytearray)):
        return obj.hex()
    if isinstance(obj, (str, int, float, bool)) or obj is None:
        return obj
    if isinstance(obj, (list, tuple)):
        return [py_serialize(x) for x in obj]
    if isinstance(obj, dict):
        return {str(k): py_serialize(v) for k, v in obj.items()}
    try:
        return py_serialize(obj.__dict__)
    except Exception:
        return str(obj)

def canonical_json(obj: Any) -> str:
    # deterministic JSON encoding for receipts
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def to_principal(x: Any) -> ICPrincipal:
    if isinstance(x, ICPrincipal):
        return x
    if isinstance(x, (bytes, bytearray)):
        try:
            return ICPrincipal.from_str(x)
        except Exception:
            try:
                return ICPrincipal(x)
            except Exception as e:
                raise ValueError(f"Cannot convert bytes->Principal: {e}")
    if isinstance(x, str):
        s = x.strip()
        # prefer from_text if available
        try:
            return ICPrincipal.from_text(s)
        except Exception:
            pass
        for ctor_name in ("from_text", "from_str", "from_hex"):
            ctor = getattr(ICPrincipal, ctor_name, None)
            if callable(ctor):
                try:
                    return ctor(s)
                except Exception:
                    continue
        try:
            return ICPrincipal(s)
        except Exception as e:
            raise ValueError(f"Could not parse principal from string '{s}': {e}")
    raise ValueError(f"Unsupported principal type: {type(x)}. Expected text or ic-py Principal.")

def verify_manifest_signature(manifest: dict):
    try:
        sig = manifest.get("signature")
        pub = manifest.get("pubkey")
        if not sig or not pub:
            raise ValueError("Missing signature or pubkey.")
        m = {k: v for k, v in manifest.items() if k not in ("signature", "pubkey")}
        canonical = canonical_json(m).encode()
        vk = VerifyKey(pub, encoder=HexEncoder)
        vk.verify(canonical, bytes.fromhex(sig))
        return True
    except Exception as e:
        raise ValueError(f"Manifest signature verification failed: {e}")

# Robust MCP call wrapper
async def call_mcp_tool(client: httpx.AsyncClient, tool: str, args: dict):
    url = f"{MCP_ENDPOINT}/tool/{tool}"
    try:
        resp = await client.post(url, json=args, timeout=30.0)
        resp.raise_for_status()
        return resp.json()
    except ConnectError as e:
        raise RuntimeError(f"Failed to connect to MCP server at {url}: {e}")
    except TimeoutException as e:
        raise RuntimeError(f"Timeout when calling MCP server at {url}: {e}")
    except HTTPStatusError as e:
        body = e.response.text if e.response is not None else ""
        raise RuntimeError(f"MCP server HTTP error {e.response.status_code} for {url}: {body}")
    except Exception as e:
        raise RuntimeError(f"Error calling MCP server {url}: {e}")
    
# ----------------- Health check helper -----------------
async def check_agent_health(manifest: dict, timeout: float = 3.0) -> bool:
    """
    Return True if the agent appears alive via health_check or endpoint/health.
    Expects manifest to contain either 'health_check' or 'endpoint'.
    """
    # prefer explicit health_check
    url = manifest.get("health_check")
    if not url:
        ep = manifest.get("endpoint")
        if ep:
            url = ep.rstrip("/") + "/health"
    if not url:
        return False
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(url, timeout=timeout)
            # accept 200 OK as healthy; optionally parse JSON content if you want
            return r.status_code == 200
    except Exception:
        return False


# ----------------- Startup -----------------
@app.on_event("startup")
async def startup_event():
    global _registry_canister
    if USE_MOCK_REGISTRY:
        print("[orchestrator] WARNING: Using MOCK REGISTRY (in-memory). Data will be lost on restart.")
        _registry_canister = MockRegistry()
        return

    canister_id = load_canister_id()
    if not os.path.exists(REGISTRY_DID_PATH):
        raise FileNotFoundError(f"Candid file not found at {REGISTRY_DID_PATH}. Run `dfx generate`.")
    candid_text = open(REGISTRY_DID_PATH, "r", encoding="utf-8").read()

    identity = Identity()
    client = Client(url=IC_HOST)
    agent = Agent(identity, client)
    _registry_canister = Canister(agent=agent, canister_id=canister_id, candid=candid_text)
    print(f"[orchestrator] connected to canister {canister_id} at {IC_HOST}")

# ----------------- Routes -----------------
@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/agents")
async def list_agents():
    if _registry_canister is None:
        raise HTTPException(status_code=500, detail="Canister not initialized.")
    try:
        res = await _registry_canister.list_agents_async()
        return JSONResponse(py_serialize(res))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling canister: {e}")

@app.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    if _registry_canister is None:
        raise HTTPException(status_code=500, detail="Canister not initialized.")
    try:
        res = await _registry_canister.get_agent_async(agent_id)
        if res is None:
            raise HTTPException(status_code=404, detail="Agent not found")
        return JSONResponse(py_serialize(res))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling canister: {e}")


@app.post("/plan")
async def plan_agent(request: Request):
    """
    Plan endpoint: uses LLM adapter to generate a structured plan.
    It will also optionally fetch context snippets from the MCP search tool (if available).
    """
    data = await request.json()
    manifest_id = data.get("manifest_id")
    prompt = data.get("prompt", "")

    if not manifest_id:
        raise HTTPException(status_code=400, detail="manifest_id required")

    if _registry_canister is None:
        raise HTTPException(status_code=500, detail="Canister not initialized.")

    # fetch manifest to ensure agent exists
    manifest = await _registry_canister.get_agent_async(manifest_id)
    if manifest is None:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Attempt to fetch context snippets from MCP (best-effort)
    context_snippets = None
    try:
        async with httpx.AsyncClient() as client:
            # call the MCP server search_docs tool to produce context
            # If MCP isn't available or search fails, we silently continue with no context.
            resp = await client.post(f"{MCP_ENDPOINT}/tool/search_docs", json={"query": prompt, "k": 3}, timeout=8.0)
            if resp.status_code == 200:
                context_snippets = resp.json().get("results")
    except Exception:
        context_snippets = None

    # call the adapter (defaults to stub unless OPENAI configured)
    try:
        plan = plan_with_llm(manifest, prompt, context_snippets)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM planning error: {e}")

    # validate/normalize the plan shape (adapter already does basic validation)
    try:
        # our adapter returns plan['steps'] etc. If further validation required, do it here.
        return JSONResponse(plan)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Invalid plan returned: {e}")


@app.post("/chat/plan")
async def chat_plan(request: Request):
    """
    Automatic discovery and planning endpoint.
    1. Fetches all agents from registry.
    2. Uses LLM to select agents and generate a plan.
    """
    data = await request.json()
    prompt = data.get("prompt", "")
    messages = data.get("messages", [])
    user_text = data.get("user", "2vxsx-fae")

    if not prompt and not messages:
        raise HTTPException(status_code=400, detail="prompt or messages required")

    if _registry_canister is None:
        raise HTTPException(status_code=500, detail="Canister not initialized.")

    # 1. List all agents
    try:
        raw_agents = await _registry_canister.list_agents_async()
        # Normalize agents
        agents = py_serialize(raw_agents)
        # Handle nested list structure if present (similar to normalize_serialized_manifest logic)
        # list_agents_async usually returns [ [agent1, agent2, ...] ] or similar
        normalized_agents = []
        
        # unwrapping logic
        if isinstance(agents, list) and len(agents) > 0:
            if isinstance(agents[0], list):
                # [[a1, a2]]
                flat = agents[0]
            else:
                flat = agents
            
            for ag in flat:
                try:
                    # use normalize_serialized_manifest to clean up each agent
                    norm = normalize_serialized_manifest(ag)
                    # unwrap optional fields for better LLM context
                    norm["endpoint"] = norm.get("endpoint", [None])[0] if isinstance(norm.get("endpoint"), list) else norm.get("endpoint")
                    norm["allowed_tools"] = norm.get("allowed_tools", [[]])[0] if isinstance(norm.get("allowed_tools"), list) and len(norm.get("allowed_tools")) > 0 and isinstance(norm.get("allowed_tools")[0], list) else norm.get("allowed_tools")
                    
                    normalized_agents.append(norm)
                except Exception:
                    continue
        else:
            normalized_agents = []

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing agents: {e}")

    # 2. Generate Plan
    try:
        plan = discover_and_plan(normalized_agents, prompt, messages=messages)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Discovery planning error: {e}")

    return JSONResponse(plan)


@app.post("/register")
async def register_agent(request: Request):
    payload = await request.json()

    if _registry_canister is None:
        raise HTTPException(status_code=500, detail="Canister not initialized.")

    try:
        if "id" not in payload or "name" not in payload:
            raise HTTPException(status_code=400, detail="Missing required fields 'id' or 'name'")

        # parse / validate developer into ICPrincipal (but send text to canister)
        try:
            dev_field = payload.get("developer", "2vxsx-fae")
            developer_principal = to_principal(dev_field)  # returns ICPrincipal
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid developer principal: {e}")

        # created_at numeric
        if "created_at" in payload:
            try:
                created_at_val = int(payload["created_at"])
            except Exception:
                raise HTTPException(status_code=400, detail="created_at must be numeric")
        else:
            import time as _time
            created_at_val = int(_time.time())

        # optional health check (best-effort)
        endpoint = payload.get("endpoint")
        
        # Docker-friendly: rewrite localhost to host.docker.internal
        # if endpoint and ("localhost" in endpoint or "127.0.0.1" in endpoint):
        #     print(f"[orchestrator] Rewriting endpoint {endpoint} to use host.docker.internal")
        #     endpoint = endpoint.replace("localhost", "host.docker.internal").replace("127.0.0.1", "host.docker.internal")
        #     payload["endpoint"] = endpoint # Update payload so it's stored correctly

        health_url = payload.get("health_check") or (endpoint.rstrip("/") + "/health" if endpoint else None)
        if endpoint and health_url:
            try:
                async with httpx.AsyncClient() as hc:
                    r = await hc.get(health_url, timeout=3.0)
                    if r.status_code != 200:
                        raise HTTPException(status_code=400, detail=f"Agent health_check failed: {health_url} returned {r.status_code}")
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Agent health_check failed: {e}")

        # Build canonical manifest as a Python dict (ic-py expects a dict here)
        # Keys are the candid record field names. Use ICPrincipal for 'developer'.

# ... (earlier code unchanged)

# Build canonical manifest as a Python dict (ic-py expects a dict here)
# Keys are the candid record field names. Use ICPrincipal for 'developer'.
        developer_principal_obj = developer_principal  # result of to_principal(...)

# Helper to wrap opt fields correctly for ic-py
        def wrap_opt(value):
            return [value] if value is not None else []

        allowed_tools_val = None
        if payload.get("allowed_tools") is not None:
            allowed_tools_val = list(payload.get("allowed_tools"))  # Ensure it's a list
            if not isinstance(allowed_tools_val, list):
                raise HTTPException(status_code=400, detail="allowed_tools must be a list")

        # ... (earlier code unchanged, including wrap_opt and allowed_tools_val)

        rec = {
            "id": str(payload["id"]),
            "name": str(payload.get("name", "")),
            "description": str(payload.get("description", "")),
            # Convert Principal to str for ic-py encoding (Candid principal is text-based)
            "developer": developer_principal.to_str(),
            "version": str(payload.get("version", "0.1.0")),
            "created_at": int(created_at_val),
            # optional values: wrap in list for ic-py opt handling
            "pubkey": wrap_opt(payload.get("pubkey")),
            "manifest_hash": wrap_opt(None),  # Always none on input ([]), computed in canister
            "endpoint": wrap_opt(payload.get("endpoint")),
            "health_check": wrap_opt(payload.get("health_check")),
            "allowed_tools": [allowed_tools_val] if allowed_tools_val is not None else [],
        }

# Debug print so you can see exactly what gets serialized
        try:
            print("[orchestrator] debug: canonical manifest ->", json.dumps(py_serialize(rec), indent=2, ensure_ascii=False))
        except Exception:
            print("[orchestrator] debug: canonical manifest (raw)", repr(rec))

# call canister with dict
        res = await _registry_canister.register_agent_async(rec)
        return JSONResponse({"ok": bool(res)})

# ... (rest unchanged)

# ... (rest unchanged)


    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error registering agent: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
