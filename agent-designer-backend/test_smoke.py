"""Smoke test all V1 API endpoints."""
import urllib.request
import urllib.error
import json

BASE = "http://127.0.0.1:8180"


def api(method, path, body=None):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    if body:
        req.add_header("Content-Type", "application/json")
    try:
        r = urllib.request.urlopen(req)
        content = r.read().decode()
        return r.status, json.loads(content) if content else None
    except urllib.error.HTTPError as e:
        content = e.read().decode() if e.fp else ""
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, content


def main():
    print("=" * 60)
    print("AgentFlow API Smoke Tests")
    print("=" * 60)

    # === HEALTH ===
    print("\n--- HEALTH ---")
    s, d = api("GET", "/health")
    print(f"  GET /health: {s} -> {d}")

    s, d = api("GET", "/health/ready")
    print(f"  GET /health/ready: {s} -> {d}")

    # === FLOWS ===
    print("\n--- FLOWS ---")

    s, d = api("POST", "/api/v1/flows", {
        "name": "Execution Test Flow",
        "description": "Flow for testing executions",
        "tags": ["test"],
        "nodes": [
            {"id": "n1", "type": "chat_input", "position": {"x": 0, "y": 0}, "data": {"label": "Input"}},
            {"id": "n2", "type": "prompt_template", "position": {"x": 200, "y": 0}, "data": {"label": "Prompt", "template": "Echo: {input}"}},
            {"id": "n3", "type": "chat_output", "position": {"x": 400, "y": 0}, "data": {"label": "Output"}}
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3"}
        ]
    })
    print(f"  POST /api/v1/flows: {s}")
    flow_id = d["id"] if s == 201 else None
    print(f"    flow_id = {flow_id}")

    s, d = api("GET", "/api/v1/flows?skip=0&limit=10")
    print(f"  GET /api/v1/flows: {s}, count={len(d) if isinstance(d, list) else '?'}")

    s, d = api("GET", f"/api/v1/flows/{flow_id}")
    print(f"  GET /api/v1/flows/{{id}}: {s}, name={d.get('name') if isinstance(d, dict) else '?'}")

    s, d = api("PUT", f"/api/v1/flows/{flow_id}", {
        "name": "Updated Test Flow",
        "description": "Updated description",
        "tags": ["updated"],
        "nodes": [
            {"id": "n1", "type": "chat_input", "position": {"x": 0, "y": 0}, "data": {"label": "Input"}},
            {"id": "n3", "type": "chat_output", "position": {"x": 200, "y": 0}, "data": {"label": "Output"}}
        ],
        "edges": [{"id": "e1", "source": "n1", "target": "n3"}]
    })
    print(f"  PUT /api/v1/flows/{{id}}: {s}, name={d.get('name') if isinstance(d, dict) else '?'}")

    # === EXECUTIONS ===
    print("\n--- EXECUTIONS ---")

    s, d = api("POST", f"/api/v1/executions/flows/{flow_id}/run", {
        "message": "Hello from smoke test!",
        "session_id": "smoke-session-001",
        "variables": {}
    })
    print(f"  POST /executions/flows/{{id}}/run: {s}")
    execution_id = None
    if s == 202 and isinstance(d, dict):
        execution_id = d.get("execution_id")
        print(f"    execution_id = {execution_id}")
    else:
        print(f"    response = {d}")

    s, d = api("GET", "/api/v1/executions?skip=0&limit=10")
    print(f"  GET /api/v1/executions: {s}, count={len(d) if isinstance(d, list) else d}")

    if execution_id:
        s, d = api("GET", f"/api/v1/executions/{execution_id}")
        print(f"  GET /executions/{{id}}: {s}, status={d.get('status') if isinstance(d, dict) else d}")

        s, d = api("GET", f"/api/v1/executions/{execution_id}/logs?skip=0&limit=100")
        print(f"  GET /executions/{{id}}/logs: {s}, count={len(d) if isinstance(d, list) else d}")

        s, d = api("POST", f"/api/v1/executions/{execution_id}/stop")
        print(f"  POST /executions/{{id}}/stop: {s}, response={d}")

    # === NODE REGISTRY ===
    print("\n--- NODE REGISTRY ---")

    s, d = api("GET", "/api/v1/nodes")
    if isinstance(d, list):
        types = [n.get("type") or n.get("node_type") for n in d]
        print(f"  GET /api/v1/nodes: {s}, types={types}")
    else:
        print(f"  GET /api/v1/nodes: {s}, {d}")

    for ntype in ["chat_input", "prompt_template", "model", "mcp_tool", "rag_agent", "memory", "chat_output"]:
        s, d = api("GET", f"/api/v1/nodes/{ntype}")
        print(f"  GET /nodes/{ntype}: {s}")

    # === LLM CONNECTORS ===
    print("\n--- LLM CONNECTORS ---")

    s, d = api("GET", "/api/v1/llm/models?provider=azure_openai")
    print(f"  GET /llm/models?provider=azure_openai: {s}, {d}")

    s, d = api("POST", "/api/v1/llm/test", {"provider": "azure_openai", "model": "gpt-4.1"})
    print(f"  POST /llm/test: {s}, {str(d)[:120]}")

    s, d = api("POST", "/api/v1/llm/chat", {
        "provider": "azure_openai",
        "model": "gpt-4.1",
        "messages": [{"role": "user", "content": "Hi"}],
        "temperature": 0.7,
        "max_tokens": 10
    })
    print(f"  POST /llm/chat: {s}, {str(d)[:120]}")

    # === OLLAMA (LOCAL LLM) ===
    print("\n--- OLLAMA (LOCAL LLM) ---")

    s, d = api("GET", "/api/v1/llm/models?provider=ollama")
    models = d.get("models", []) if isinstance(d, dict) else []
    print(f"  GET /llm/models?provider=ollama: {s}, count={len(models)}")
    if models:
        print(f"    models (first 5): {models[:5]}")

    s, d = api("POST", "/api/v1/llm/chat", {
        "provider": "ollama",
        "model": "qwen3.6:27b",
        "messages": [{"role": "user", "content": "what is capital of France in one word"}],
        "temperature": 0.7,
        "max_tokens": 500
    })
    print(f"  POST /llm/chat (ollama/qwen3.6:27b): {s}, response={str(d)[:120]}")

    s, d = api("POST", "/api/v1/llm/test", {"provider": "ollama", "model": "qwen3.6:27b"})
    print(f"  POST /llm/test (ollama): {s}, {str(d)[:120]}")

    # === MCP TOOLS ===
    print("\n--- MCP TOOLS ---")

    s, d = api("POST", "/api/v1/mcp/test", {"server_url": "http://localhost:8080", "tool_name": None})
    print(f"  POST /mcp/test: {s}, {str(d)[:120]}")

    # === KNOWLEDGE BASES ===
    print("\n--- KNOWLEDGE BASES ---")

    s, d = api("POST", "/api/v1/knowledge-bases", {
        "name": "Smoke Test KB",
        "description": "KB for smoke testing",
        "embedding_model": "azure_openai:text-embedding-3-small",
        "chunk_size": 512,
        "chunk_overlap": 50,
        "vectordb_config": {}
    })
    print(f"  POST /knowledge-bases: {s}")
    kb_id = d.get("id") if s == 201 and isinstance(d, dict) else None
    print(f"    kb_id = {kb_id}")

    s, d = api("GET", "/api/v1/knowledge-bases?skip=0&limit=10")
    print(f"  GET /knowledge-bases: {s}, count={len(d) if isinstance(d, list) else d}")

    if kb_id:
        s, d = api("GET", f"/api/v1/knowledge-bases/{kb_id}")
        print(f"  GET /knowledge-bases/{{id}}: {s}, name={d.get('name') if isinstance(d, dict) else d}")

        s, d = api("PUT", f"/api/v1/knowledge-bases/{kb_id}", {"name": "Updated KB", "description": "Updated"})
        print(f"  PUT /knowledge-bases/{{id}}: {s}")

        s, d = api("DELETE", f"/api/v1/knowledge-bases/{kb_id}")
        print(f"  DELETE /knowledge-bases/{{id}}: {s}")

    # === MEMORY ===
    print("\n--- MEMORY ---")

    s, d = api("POST", f"/api/v1/memory/{flow_id}?session_id=smoke-session", {
        "role": "user",
        "content": "What is the capital of France?"
    })
    print(f"  POST /memory/{{flow_id}}: {s}, {d}")

    s, d = api("POST", f"/api/v1/memory/{flow_id}?session_id=smoke-session", {
        "role": "assistant",
        "content": "The capital of France is Paris."
    })
    print(f"  POST /memory/{{flow_id}} (2nd): {s}")

    s, d = api("GET", f"/api/v1/memory/{flow_id}?session_id=smoke-session")
    print(f"  GET /memory/{{flow_id}}: {s}, entries={len(d) if isinstance(d, list) else d}")

    s, d = api("DELETE", f"/api/v1/memory/{flow_id}?session_id=smoke-session")
    print(f"  DELETE /memory/{{flow_id}}: {s}")

    # Verify cleared
    s, d = api("GET", f"/api/v1/memory/{flow_id}?session_id=smoke-session")
    print(f"  GET /memory (after clear): {s}, entries={len(d) if isinstance(d, list) else d}")

    # === CLEANUP ===
    print("\n--- CLEANUP ---")
    s, d = api("DELETE", f"/api/v1/flows/{flow_id}")
    print(f"  DELETE /flows/{{id}}: {s}")

    print("\n" + "=" * 60)
    print("SMOKE TESTS COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
