# dev_agent.py -- a tiny developer-hosted agent for testing (Model A)
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(title="Dev Agent (mock)")

@app.get("/health")
def health():
    return JSONResponse({"status":"ok"})

@app.post("/execute")
async def execute(req: Request):
    data = await req.json()
    # very small fake behavior: return a ticket id if prompt mentions login
    prompt = data.get("prompt", "")
    # simulate doing work: parse prompt, call local tools, etc.
    if "login" in prompt.lower():
        return JSONResponse({"ok": True, "result": {"outcome": "created_ticket", "ticket_id": "DEV-TICKET-1", "notes": "Reset password flow recommended"}})
    return JSONResponse({"ok": True, "result": {"outcome": "handled", "text": f"Echo: {prompt}"}})
