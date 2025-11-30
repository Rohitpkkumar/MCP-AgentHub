# orchestrator/prompts.py
# orchestrator/prompts.py
BASE_INSTRUCTION = (
    "You are a planning assistant that outputs strict JSON plans.\n"
    "The plan must follow this schema:\n"
    "{'steps':[{'tool': string, 'args': object}]}.\n"
    "Allowed tools: search_docs, create_ticket, call_api, send_email, call_agent.\n"
    "Do not add explanations or text outside JSON.\n"
)


def render_prompt(prompt: str, context_snippets=None) -> str:
    ctx = ""
    if context_snippets:
        ctx = "\nContext snippets:\n" + "\n".join(s.get("snippet", "") for s in context_snippets)
    return f"{BASE_INSTRUCTION}{ctx}\n\nUser request: {prompt}\nReturn JSON only."
