# mcp-servers/search_docs.py
from fastapi import FastAPI
from pydantic import BaseModel
import weaviate
import os

WEAVIATE_URL = os.getenv("WEAVIATE_URL", "http://localhost:8080")
CLASS_NAME = os.getenv("VECTOR_CLASS", "Document")

app = FastAPI()

class SearchArgs(BaseModel):
    query: str
    k: int = 3

client = weaviate.Client(url=WEAVIATE_URL)

@app.post("/tool/search_docs")
def search_docs(args: SearchArgs):
    q = args.query
    k = args.k or 3
    # compute embedding locally with same model as ingest
    # to avoid importing sentence-transformers here, we can call weaviate's vector-search with textual query?
    # But since we used vectorizer none, we must compute embedding locally here too.
    # For simplicity, compute embedding using sentence-transformers
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2"))
    v = model.encode(q).tolist()
    # run vector search
    res = (
        client.query
        .get(CLASS_NAME, ["title", "text", "source"])
        .with_near_vector({"vector": v})
        .with_limit(k)
        .do()
    )
    results = []
    hits = res.get("data", {}).get("Get", {}).get(CLASS_NAME, [])
    for h in hits:
        title = h.get("title") or h.get("name") or ""
        text = h.get("text") or ""
        results.append({
            "id": h.get("id", ""),
            "title": title,
            "snippet": text[:400] if text else ""
        })
    return {"results": results}

