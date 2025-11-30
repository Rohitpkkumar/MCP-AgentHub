# orchestrator/schemas.py
from jsonschema import Draft7Validator, ValidationError

PLAN_SCHEMA = {
    "type": "object",
    "properties": {
        "steps": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "tool": {"type": "string", "enum": ["search_docs", "create_ticket", "call_api", "send_email", "call_agent", "answer_user", "no_agent_found"]},

                    "args": {"type": "object"}
                },
                "required": ["tool", "args"]
            }
        },
        "_meta": {"type": "object"},
    },
    "required": ["steps"],
    "additionalProperties": True
}

def validate_plan_schema(plan: dict):
    """
    Validate plan dict against PLAN_SCHEMA.
    Raises ValidationError if invalid.
    """
    validator = Draft7Validator(PLAN_SCHEMA)
    errors = sorted(validator.iter_errors(plan), key=lambda e: e.path)
    if errors:
        msg = "; ".join([f"{'/'.join(map(str, e.path))}: {e.message}" for e in errors])
        raise ValidationError(msg)
