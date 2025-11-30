import uvicorn
import os
import logging
import chromadb
from chromadb.utils import embedding_functions
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rag_agent")

app = FastAPI(title="RAG Agent (MCP Standard)")

# --- RAG Setup ---
CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_db")
COLLECTION_NAME = "knowledge_base"

# Initialize ChromaDB
try:
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    # Use default embedding function (all-MiniLM-L6-v2)
    # Note: In production, you might want to use a specific model explicitly
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME, embedding_function=ef)
    logger.info(f"Connected to ChromaDB at {CHROMA_PATH}, collection: {COLLECTION_NAME}")
except Exception as e:
    logger.error(f"Failed to initialize ChromaDB: {e}")
    collection = None

# --- MCP JSON-RPC Models ---
class JsonRpcRequest(BaseModel):
    jsonrpc: str
    method: str
    params: Optional[Dict[str, Any]] = None
    id: Optional[Any] = None

class JsonRpcResponse(BaseModel):
    jsonrpc: str = "2.0"
    result: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None
    id: Optional[Any] = None

# --- Tools Implementation ---

def add_document(text: str, metadata: Dict[str, Any] = None) -> str:
    if not collection:
        return "Error: Database not initialized."
    
    import uuid
    doc_id = str(uuid.uuid4())
    meta = metadata or {"source": "manual"}
    
    try:
        collection.add(
            documents=[text],
            metadatas=[meta],
            ids=[doc_id]
        )
        return f"Document added successfully with ID: {doc_id}"
    except Exception as e:
        return f"Error adding document: {str(e)}"

def query_knowledge(query: str, n_results: int = 3) -> str:
    if not collection:
        return "Error: Database not initialized."
    
    try:
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        # Format results
        output = []
        if results['documents']:
            for i, doc in enumerate(results['documents'][0]):
                meta = results['metadatas'][0][i] if results['metadatas'] else {}
                output.append(f"Result {i+1}: {doc} (Metadata: {meta})")
        
        return "\n\n".join(output) if output else "No relevant documents found."
    except Exception as e:
        return f"Error querying database: {str(e)}"

# --- MCP Protocol Handlers ---

TOOLS = [
    {
        "name": "add_document",
        "description": "Add a text document to the knowledge base.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "The content of the document"},
                "metadata": {"type": "object", "description": "Optional metadata (key-value pairs)"}
            },
            "required": ["text"]
        }
    },
    {
        "name": "query_knowledge",
        "description": "Query the knowledge base for relevant information.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The search query"},
                "n_results": {"type": "integer", "description": "Number of results to return (default 3)"}
            },
            "required": ["query"]
        }
    }
]

@app.post("/mcp")
async def handle_mcp(request: JsonRpcRequest):
    """
    Standard MCP JSON-RPC endpoint.
    """
    method = request.method
    params = request.params or {}
    
    if method == "tools/list":
        return JsonRpcResponse(id=request.id, result={"tools": TOOLS})
    
    elif method == "tools/call":
        name = params.get("name")
        args = params.get("arguments", {})
        
        if name == "add_document":
            result = add_document(args.get("text"), args.get("metadata"))
            return JsonRpcResponse(id=request.id, result={"content": [{"type": "text", "text": result}]})
            
        elif name == "query_knowledge":
            result = query_knowledge(args.get("query"), args.get("n_results", 3))
            return JsonRpcResponse(id=request.id, result={"content": [{"type": "text", "text": result}]})
            
        else:
            return JsonRpcResponse(id=request.id, error={"code": -32601, "message": "Method not found"})
            
    elif method == "initialize":
        return JsonRpcResponse(id=request.id, result={
            "protocolVersion": "0.1.0",
            "capabilities": {
                "tools": {}
            },
            "serverInfo": {
                "name": "rag_agent",
                "version": "0.1.0"
            }
        })
        
    else:
        return JsonRpcResponse(id=request.id, error={"code": -32601, "message": "Method not found"})

# --- Legacy Compatibility Endpoint ---

@app.post("/execute")
async def execute(request: Request):
    """
    Legacy endpoint for orchestrator compatibility.
    Maps 'prompt' to 'query_knowledge' or 'add_document' based on heuristic or explicit instruction.
    For simplicity, we'll assume this agent is primarily used for QUERYING via /execute unless specified.
    """
    data = await request.json()
    prompt = data.get("prompt", "")
    
    # Simple heuristic: if prompt starts with "ADD:", treat as add
    if prompt.startswith("ADD:"):
        content = prompt[4:].strip()
        result = add_document(content)
    else:
        result = query_knowledge(prompt)
    
    return JSONResponse({
        "result": result,
        "status": "success"
    })

@app.get("/health")
async def health():
    return {"status": "ok", "chroma": bool(collection)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7003)
