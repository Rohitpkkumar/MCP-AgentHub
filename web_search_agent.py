import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(title="Web Search Agent")

@app.post("/execute")
async def execute(request: Request):
    data = await request.json()
    prompt = data.get("prompt", "")
    
    # Mock search results
    results = [
        f"Result 1 for '{prompt}': AI is transforming industries.",
        f"Result 2 for '{prompt}': New advancements in LLMs announced.",
        f"Result 3 for '{prompt}': How to use multi-agent systems."
    ]
    
    return JSONResponse({
        "result": "\n".join(results),
        "status": "success"
    })

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7002)
