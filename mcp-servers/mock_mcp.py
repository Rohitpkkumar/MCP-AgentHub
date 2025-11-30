# mcp-servers/mock_mcp.py
# Single FastAPI app that exposes:
#  - POST /tool/search_docs   -> real Weaviate-backed search if WEAVIATE_URL is available, else returns safe mock results
#  - POST /tool/create_ticket -> simple ticket creation mock used by the orchestrator

import os
from typing import List, Dict, Any
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
import logging
import httpx
from urllib.parse import urljoin

# Optional heavy deps: import lazily so server still starts without weaviate/sentence-transformers installed
WEAVIATE_URL = os.getenv("WEAVIATE_URL", "http://localhost:8080")
EMBED_MODEL = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
CLASS_NAME = os.getenv("VECTOR_CLASS", "Document")

app = FastAPI(title="Mock MCP / Search Docs (dev)")

log = logging.getLogger("mock_mcp")
logging.basicConfig(level=logging.INFO)

# Lazily initialized resources
_weaviate_client = None
_embed_model = None

def get_weaviate_client():
    global _weaviate_client
    if _weaviate_client is None:
        try:
            import weaviate
            _weaviate_client = weaviate.Client(url=WEAVIATE_URL)
            log.info("Connected to Weaviate at %s", WEAVIATE_URL)
        except Exception as e:
            log.warning("Weaviate client init failed: %s", e)
            _weaviate_client = None
    return _weaviate_client

def get_embed_model():
    global _embed_model
    if _embed_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embed_model = SentenceTransformer(EMBED_MODEL)
            log.info("Loaded embed model: %s", EMBED_MODEL)
        except Exception as e:
            log.warning("Embedding model init failed: %s", e)
            _embed_model = None
    return _embed_model

@app.post("/tool/search_docs")
async def search_docs(request: Request):
    """
    Query body: { "query": "<text>", "k": 3 }
    If Weaviate is available and the embedding model is available, performs a vector search.
    Otherwise returns deterministic mock results.
    Returns: {"results": [{"id": "...", "title": "...", "snippet": "..."}]}
    """
    body = await request.json()
    query = body.get("query", "")
    k = int(body.get("k", 3) or 3)

    if not query:
        raise HTTPException(status_code=400, detail="query is required")

    client = get_weaviate_client()
    model = get_embed_model()

    # If Weaviate + model available, do real vector search
    if client is not None and model is not None:
        try:
            # Compute embedding vector (list)
            vec = model.encode(query).tolist()

            # Build query - include additional id in response
            # request properties you stored during ingestion (title, text, source, etc.)
            q = (
                client.query
                .get(CLASS_NAME, ["title", "text", "source"])
                .with_near_vector({"vector": vec})
                .with_additional(["id", "certainty"])
                .with_limit(k)
            )
            res = q.do()

            hits = res.get("data", {}).get("Get", {}).get(CLASS_NAME, [])
            results = []
            seen_ids = set()
            for h in hits:
                # id is under '_additional' when using with_additional
                add = h.get("_additional", {}) or {}
                doc_id = add.get("id") or ""
                title = h.get("title") or h.get("name") or ""
                # try several common property names for content
                text = h.get("text") or h.get("content") or ""
                snippet = (text[:400] if isinstance(text, str) else "") or ""
                # avoid duplicates
                if doc_id in seen_ids:
                    continue
                seen_ids.add(doc_id)
                results.append({"id": doc_id, "title": title, "snippet": snippet})
            # If no hits returned, fallthrough to mock format
            if not results:
                log.info("Weaviate returned no results, falling back to mock snippets")
                results = [
                    {"id":"", "title":"", "snippet": f"No relevant snippets found for: {query}"}
                ]
            return JSONResponse({"results": results})
        except Exception as e:
            log.exception("Weaviate query failed, returning mock results: %s", e)
            # fallthrough to mock

    # Fallback mock results (when weaviate or model not available)
    mock_results = [
        {"id": "doc1", "title": "doc1.txt", "snippet": f"{query}. They receive 401."},
        {"id": "doc2", "title": "doc2.txt", "snippet": f"{query}. Reset password may help."},
    ][:k]
    return JSONResponse({"results": mock_results})


@app.post("/tool/create_ticket")
async def create_ticket(request: Request):
    """
    Simple ticket creation mock for development.
    Expects JSON with 'title' and 'body' (optional).
    Returns: { "ticket_id": "...", "status":"created", "title": "...", "body": "...", "url": "..." }
    """
    body = await request.json()
    title = body.get("title", "Untitled")
    content = body.get("body", "")
    # produce predictable ID
    ticket_id = "TICKET-" + (title[:6].strip().upper().replace(" ", "_") or "AUTO")
    resp = {
        "ticket_id": ticket_id,
        "status": "created",
        "title": title,
        "body": content,
        "url": f"http://mock.helpdesk.local/{ticket_id}"
    }
    log.info("Created mock ticket %s for title=%s", ticket_id, title)
    return JSONResponse(resp)


@app.post("/tool/answer_user")
async def answer_user(request: Request):
    """
    Direct answer from the LLM to the user.
    Args JSON: { "answer": "..." }
    Returns: { "answer": "..." }
    """
    body = await request.json()
    answer = body.get("answer", "")
    return JSONResponse({"answer": answer})


# mcp-servers/mock_mcp.py  (add below /tool/create_ticket)

@app.post("/tool/call_agent")
async def call_agent(request: Request):
    """
    Args JSON: {
      "endpoint": "http://127.0.0.1:7001",
      "path": "/execute",           # optional, defaults to /execute
      "method": "POST",            # optional, GET/POST supported
      "payload": {...}             # optional object to forward as JSON body
    }
    Returns: proxy of agent response (JSON)
    """
    body = await request.json()
    endpoint = body.get("endpoint")
    if not endpoint:
        raise HTTPException(status_code=400, detail="missing endpoint")
    path = body.get("path", "/execute")
    method = body.get("method", "POST").upper()
    payload = body.get("payload", {})

    # Build full URL
    url = endpoint.rstrip("/") + path

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            if method == "POST":
                resp = await client.post(url, json=payload)
            elif method == "GET":
                resp = await client.get(url, params=payload)
            else:
                raise HTTPException(status_code=400, detail=f"unsupported method {method}")

        # If agent returned non-JSON, return text under "text"
        try:
            resp.raise_for_status()
        except httpx.HTTPStatusError:
            # propagate status and body for debugging
            raise HTTPException(status_code=502, detail=f"Agent returned HTTP {resp.status_code}: {resp.text}")

        # attempt to parse JSON; if fails, return raw text as "text"
        try:
            data = resp.json()
        except Exception:
            data = {"text": resp.text}
        return JSONResponse(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"call_agent error: {e}")

# health / debug endpoint
@app.get("/health")
async def health():
    return {"status":"ok", "weaviate": bool(get_weaviate_client() is not None)}
