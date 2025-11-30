import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(title="Summarise Agent")

@app.post("/execute")
async def execute(request: Request):
    data = await request.json()
    prompt = data.get("prompt", "")
    
    # Mock summary
    summary = f"SUMMARY: The input text discussed '{prompt[:50]}...'. Key points include rapid AI growth and agentic workflows."
    
    return JSONResponse({
        "result": summary,
        "status": "success"
    })

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7003)
