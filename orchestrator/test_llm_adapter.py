# orchestrator/test_llm_adapter.py
from llm_adapter import plan_with_llm

def test_stub_plan():
    manifest = {"id": "agent-test", "name": "Test Agent", "developer": "2vxsx-fae"}
    prompt = "Customer cannot login to account"
    plan = plan_with_llm(manifest, prompt, context_snippets=None, provider="stub")
    print("PLAN:", plan)

if __name__ == "__main__":
    test_stub_plan()
