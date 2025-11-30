import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(title="Email Agent")

@app.post("/execute")
async def execute(request: Request):
    data = await request.json()
    prompt = data.get("prompt", "")
    
    # Mock email sending
    print(f"[Email Agent] Sending email with content: {prompt}")
    
    return JSONResponse({
        "result": f"Email sent successfully with content: {prompt[:50]}...",
        "status": "success"
    })

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7004)
