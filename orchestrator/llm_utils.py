# orchestrator/llm_utils.py
import json
from jsonschema import ValidationError
from .schemas import validate_plan_schema

def parse_llm_output(text: str):
    """Extract JSON object from model output (ignore any leading text)."""
    text = text.strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in model output")
    try:
        return json.loads(text[start:end+1])
    except Exception as e:
        raise ValueError(f"Failed to parse JSON: {e}")

def validate_llm_plan(plan: dict):
    """Validate using schema; raises ValidationError if invalid."""
    validate_plan_schema(plan)
    return plan
