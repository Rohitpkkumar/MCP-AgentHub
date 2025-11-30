# tools/ingest_docs.py
"""
Ingest plain text documents into Weaviate with embeddings computed locally.
Usage:
  python tools/ingest_docs.py --source docs/ --class-name Document
  or provide a single JSON file with a list of {"id","text","title"} objects
"""

import os
import argparse
import json
from sentence_transformers import SentenceTransformer
import weaviate
from tqdm import tqdm

WEAVIATE_URL = os.getenv("WEAVIATE_URL", "http://localhost:8080")
EMBED_MODEL = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")  # lightweight & fast

def ensure_schema(client, class_name="Document"):
    """
    Create class if not exists. We use vectorizer: none since we supply vectors.
    Schema example: class Document { text:string; title:string; }
    """
    schema = {
        "classes": [
            {
                "class": class_name,
                "vectorizer": "none",
                "properties": [
                    {"name": "title", "dataType": ["text"]},
                    {"name": "text", "dataType": ["text"]},
                    {"name": "source", "dataType": ["text"]},
                ],
            }
        ]
    }
    existing = client.schema.get()
    names = [c["class"] for c in existing.get("classes", [])]
    if class_name not in names:
        client.schema.create_class(schema["classes"][0])
        print(f"Created class {class_name}")
    else:
        print(f"Class {class_name} already exists")

def load_docs_from_folder(folder):
    docs = []
    for fname in os.listdir(folder):
        path = os.path.join(folder, fname)
        if os.path.isdir(path):
            continue
        ext = os.path.splitext(fname)[1].lower()
        if ext in [".txt"]:
            text = open(path, "r", encoding="utf-8").read().strip()
            docs.append({"id": fname, "title": fname, "text": text, "source": path})
        elif ext in [".json"]:
            # assume file contains list of docs
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    for d in data:
                        docs.append(d)
                else:
                    docs.append(data)
    return docs

def ingest(docs, class_name="Document", batch_size=32):
    client = weaviate.Client(url=WEAVIATE_URL)
    model = SentenceTransformer(EMBED_MODEL)
    ensure_schema(client, class_name)

    with client.batch(batch_size=batch_size, dynamic=True) as batch:
        for doc in tqdm(docs, desc="Embedding & indexing"):
            text = doc.get("text") or doc.get("body") or doc.get("content") or ""
            title = doc.get("title") or doc.get("id") or ""
            if not text:
                continue
            embedding = model.encode(text).tolist()
            properties = {"title": title, "text": text, "source": doc.get("source", "")}
            batch.add_data_object(properties, class_name, vector=embedding)
    print("Ingestion complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, help="Folder or JSON file with docs")
    parser.add_argument("--class-name", default="Document")
    args = parser.parse_args()
    src = args.source
    if os.path.isdir(src):
        docs = load_docs_from_folder(src)
    else:
        docs = json.load(open(src, "r", encoding="utf-8"))
    print(f"Loaded {len(docs)} docs")
    ingest(docs, class_name=args.class_name)
