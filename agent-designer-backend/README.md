# AgentFlow Designer — Backend API

FastAPI backend for the AgentFlow Designer. Provides flow authoring, execution (powered by LangGraph), RAG pipelines, MCP tool integration, memory management, and multi-provider LLM connectivity.

---

## Table of Contents

- [Requirements](#requirements)
- [Local Setup](#local-setup-sqlite--no-external-services)
- [Environment Variables](#environment-variables-reference)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints-v1)
  - [Health](#health)
  - [Flows](#flows)
  - [Executions](#executions)
  - [Node Registry](#node-registry)
  - [LLM Connectors](#llm-connectors)
  - [MCP Tools](#mcp-tools)
  - [Knowledge Bases](#knowledge-bases)
  - [Documents](#documents)
  - [RAG Query](#rag-query)
  - [Memory](#memory)
  - [WebSocket](#websocket)
- [Request/Response Payloads](#requestresponse-payloads)
- [Execution Engine (LangGraph)](#execution-engine-langgraph)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [PostgreSQL (Production)](#running-with-postgresql-production)
- [Dependency Notes (Artifactory)](#dependency-notes-infosys-artifactory)

---

## Requirements

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.11+ or 3.14 | Tested on 3.14.2 |
| pip | latest | Use Artifactory pip.ini on Infosys network |
| Ollama | optional | Local LLM at http://localhost:11434 |
| Qdrant | optional | RAG endpoints only |
| PostgreSQL | optional | SQLite used by default for local dev |

---

## Local Setup (SQLite — no external services)

### 1. Create and activate a virtual environment

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Configure the Artifactory pip source (Infosys network)

```powershell
$env:PIP_CONFIG_FILE = ".\pip.ini"
```

### 3. Install dependencies

```powershell
# Pre-install pinned packages first (Artifactory 403 workarounds)
pip install h11==0.14.0 httpcore==1.0.8

# Install all local-dev dependencies
pip install -r requirements-local.txt
```

Or for full production dependencies:

```powershell
pip install -r requirements.txt
```

### 4. Configure environment

The `.env` file is pre-configured with SQLite defaults. No changes needed for local smoke testing.

To add LLM provider credentials, edit `.env`:

```ini
# Ollama (no credentials needed — just have ollama running)
OLLAMA_BASE_URL=http://localhost:11434/v1

# Azure OpenAI
AZURE_OPENAI_API_KEY=<your-key>
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/

# AWS Bedrock
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_REGION=us-east-1

# Google Vertex AI
GOOGLE_PROJECT_ID=<your-project>
GOOGLE_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=<path-to-service-account.json>
```

### 5. Start the server

```powershell
py run.py
```

Server starts at **http://127.0.0.1:8180**. Database tables are created automatically on first startup.

---

## Running the Server

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
py run.py
```

- **Swagger UI** → http://127.0.0.1:8180/docs
- **ReDoc** → http://127.0.0.1:8180/redoc
- **Health check** → http://127.0.0.1:8180/health

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | `AgentFlow Designer API` | Application display name |
| `APP_VERSION` | `1.0.0` | API version |
| `DEBUG` | `false` | Enables SQLAlchemy query logging |
| `CORS_ORIGINS` | `["http://localhost:5173", "http://localhost:3000"]` | Allowed CORS origins (JSON array) |
| `DATABASE_URL` | `sqlite+aiosqlite:///./agentflow-local.db` | Database connection URL |
| `OLLAMA_BASE_URL` | `http://localhost:11434/v1` | Ollama OpenAI-compatible API URL |
| `QDRANT_HOST` | `localhost` | Qdrant server host |
| `QDRANT_PORT` | `6333` | Qdrant server port |
| `QDRANT_API_KEY` | _(empty)_ | Qdrant API key (Qdrant Cloud only) |
| `QDRANT_USE_GRPC` | `false` | Use gRPC for Qdrant connections |
| `AZURE_OPENAI_API_KEY` | _(empty)_ | Azure OpenAI key |
| `AZURE_OPENAI_ENDPOINT` | _(empty)_ | Azure OpenAI endpoint URL |
| `AZURE_OPENAI_API_VERSION` | `2024-02-01` | Azure OpenAI API version |
| `AWS_ACCESS_KEY_ID` | _(empty)_ | AWS access key for Bedrock |
| `AWS_SECRET_ACCESS_KEY` | _(empty)_ | AWS secret key for Bedrock |
| `AWS_REGION` | `us-east-1` | AWS region for Bedrock |
| `GOOGLE_PROJECT_ID` | _(empty)_ | GCP project ID for Vertex AI |
| `GOOGLE_LOCATION` | `us-central1` | GCP region for Vertex AI |
| `GOOGLE_APPLICATION_CREDENTIALS` | _(empty)_ | Path to GCP service account JSON |

---

## API Endpoints (V1)

Base URL: `http://127.0.0.1:8180`

---

### Health

**Functionality:** Exposes liveness and readiness probes for the API server. The liveness probe confirms the process is alive; the readiness probe verifies the database connection is active and the server can handle traffic.

**Use:**
- Call `/health` from a load balancer or container orchestrator (Kubernetes, Docker Compose) as a liveness check — if it returns anything other than 200, the container is restarted.
- Call `/health/ready` before routing traffic to the instance (readiness gate). Also useful for smoke-testing the server after startup to confirm the DB migration ran correctly.
- Both endpoints are used by `test_ollama.py` and `_check_endpoints.py` to verify the server is up before running tests.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check → `{"status": "ok"}` |
| `GET` | `/health/ready` | Readiness check (DB connectivity) → `{"status": "ready", "checks": {"db": "ok"}}` |

---

### Flows

**Functionality:** Flows are the central concept of AgentFlow Designer. A flow is a directed acyclic graph (DAG) of nodes and edges that defines an agent pipeline — for example: receive user input → format a prompt → call an LLM → return the response. This API provides full CRUD for flow definitions stored in the database. Flows hold their node and edge configuration as JSON; no execution happens here.

**Use:**
- `GET /api/v1/flows` — called on page load by the Designer frontend to populate the flow list/sidebar.
- `POST /api/v1/flows` — called when the user saves a new flow from the canvas. Also used programmatically to seed flows for testing.
- `GET /api/v1/flows/{flow_id}` — called when the user opens a flow in the canvas editor to load its node/edge graph for rendering.
- `PUT /api/v1/flows/{flow_id}` — called on every canvas auto-save or manual save to persist node position, config, and edge changes.
- `DELETE /api/v1/flows/{flow_id}` — called when the user deletes a flow. Cascades to all associated executions and execution logs.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/flows` | List all flows |
| `POST` | `/api/v1/flows` | Create a new flow |
| `GET` | `/api/v1/flows/{flow_id}` | Get a flow by ID |
| `PUT` | `/api/v1/flows/{flow_id}` | Update flow |
| `DELETE` | `/api/v1/flows/{flow_id}` | Delete a flow (cascades to executions) |

**Query parameters** (GET list): `skip` (default 0), `limit` (default 50)

**Create flow payload** (`POST /api/v1/flows`):

```json
{
  "name": "My Agent Flow",
  "description": "A simple chat agent",
  "nodes": [
    {
      "id": "n1",
      "type": "chat_input",
      "position": {"x": 0, "y": 0},
      "data": {"label": "User Input", "config": {}}
    },
    {
      "id": "n2",
      "type": "prompt_template",
      "position": {"x": 200, "y": 0},
      "data": {
        "label": "Prompt",
        "config": {"template": "Answer concisely: {input}"}
      }
    },
    {
      "id": "n3",
      "type": "model",
      "position": {"x": 400, "y": 0},
      "data": {
        "label": "Ollama LLM",
        "config": {
          "provider": "ollama",
          "model": "qwen3.6:27b",
          "temperature": 0.7,
          "max_tokens": 500
        }
      }
    },
    {
      "id": "n4",
      "type": "chat_output",
      "position": {"x": 600, "y": 0},
      "data": {"label": "Output", "config": {}}
    }
  ],
  "edges": [
    {"id": "e1", "source": "n1", "target": "n2"},
    {"id": "e2", "source": "n2", "target": "n3"},
    {"id": "e3", "source": "n3", "target": "n4"}
  ],
  "tags": ["chat", "ollama"]
}
```

**Update flow payload** (`PUT /api/v1/flows/{flow_id}`):

```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "nodes": [...],
  "edges": [...],
  "tags": ["updated"]
}
```

All fields are optional in the update payload.

**Response** (`FlowResponse`):

```json
{
  "id": "uuid",
  "name": "My Agent Flow",
  "description": "A simple chat agent",
  "nodes": [...],
  "edges": [...],
  "tags": ["chat", "ollama"],
  "created_at": "2026-05-25T10:00:00Z",
  "updated_at": "2026-05-25T10:00:00Z"
}
```

---

### Executions

**Functionality:** Drives the asynchronous execution of a flow. When a run is triggered, the server immediately creates an execution record (status: `pending`), returns the `execution_id`, and dispatches the actual node-by-node execution as a background task powered by LangGraph. This non-blocking design allows the client to poll for status or subscribe to real-time WebSocket events while the flow runs. Each execution stores its final input, output, error, and per-node logs.

**Use:**
- `POST .../run` — triggered from the Designer's "Run" button or from external systems calling the API. The `message` field carries the user's input. Pass `session_id` to enable memory across multiple calls to the same flow. Returns `execution_id` immediately (202 Accepted).
- `GET /api/v1/executions/{id}` — poll this after triggering a run to check if the status has moved from `pending` → `running` → `completed`. Read the `output` field when status is `completed` to get the final response.
- `GET /api/v1/executions/{id}/logs` — fetch step-by-step node logs for debugging. Each log entry shows which node ran, its level (`info`, `success`, `warning`, `error`), and detail payload.
- `POST .../stop` — sends a cancellation signal to a `running` execution. The execution transitions to `stopped` status.
- `GET /api/v1/executions` — used in a run-history panel to list past executions, optionally filtered by `flow_id`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/executions/flows/{flow_id}/run` | Run a flow (async, returns 202) |
| `GET` | `/api/v1/executions` | List executions |
| `GET` | `/api/v1/executions/{execution_id}` | Get execution status/output |
| `GET` | `/api/v1/executions/{execution_id}/logs` | Get per-node execution logs |
| `POST` | `/api/v1/executions/{execution_id}/stop` | Stop a running execution |

**Query parameters** (GET list): `flow_id` (optional filter), `skip`, `limit`

**Run flow payload** (`POST /api/v1/executions/flows/{flow_id}/run`):

```json
{
  "message": "What is the capital of France?",
  "session_id": "optional-session-id",
  "variables": {"key": "value"}
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | yes | User input message |
| `session_id` | string | no | Conversation session ID (for memory) |
| `variables` | object | no | Extra variables injected into context |

**Response** (202 Accepted):

```json
{
  "execution_id": "uuid",
  "status": "pending"
}
```

**Execution status response** (`GET /api/v1/executions/{execution_id}`):

```json
{
  "id": "uuid",
  "flow_id": "uuid",
  "status": "completed",
  "started_at": "2026-05-25T10:00:01Z",
  "completed_at": "2026-05-25T10:00:05Z",
  "input": {"message": "What is the capital of France?"},
  "output": {"output": "The capital of France is Paris."},
  "error": null,
  "created_at": "2026-05-25T10:00:00Z"
}
```

**Execution statuses**: `pending` → `running` → `completed` | `error` | `stopped`

**Execution logs response** (`GET /api/v1/executions/{execution_id}/logs`):

```json
[
  {
    "id": "uuid",
    "execution_id": "uuid",
    "node_id": "n1",
    "level": "success",
    "message": "Node 'n1' completed successfully.",
    "detail": {},
    "timestamp": "2026-05-25T10:00:01Z"
  }
]
```

Log levels: `info`, `success`, `warning`, `error`

---

### Node Registry

**Functionality:** A static catalog of all available node types in the V1 execution engine. Each node definition includes its type key, display label, description, and configuration schema. This allows the frontend to dynamically render the node library palette and validate node configurations without hardcoding type information.

**Use:**
- `GET /api/v1/nodes` — called on Designer load to populate the node library panel on the left sidebar. Each entry drives the draggable node cards the user can add to the canvas.
- `GET /api/v1/nodes/{node_type}` — called when a node is selected on the canvas to fetch its configuration schema, which drives the node inspector/settings panel on the right. For example, fetching `/api/v1/nodes/model` returns the schema for provider, model name, temperature, and max_tokens fields.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/nodes` | List all V1 node type definitions |
| `GET` | `/api/v1/nodes/{node_type}` | Get schema for a specific node type |

**V1 supported node types**:

| Type | Description |
|------|-------------|
| `chat_input` | Captures user message and passes it downstream |
| `prompt_template` | Formats a prompt string using `{variable}` syntax |
| `model` | Calls an LLM provider (ollama, azure_openai, bedrock, vertex_ai) |
| `mcp_tool` | Calls a tool from an MCP server |
| `rag_agent` | Retrieves context from a knowledge base + generates answer |
| `memory` | Reads/writes conversation memory for a session |
| `chat_output` | Terminal node — collects the final response |

---

### LLM Connectors

**Functionality:** Provides direct access to LLM providers (Ollama, Azure OpenAI, AWS Bedrock, Google Vertex AI) outside of flow execution. These endpoints wrap the underlying connector layer and expose it as a standalone API for model discovery, connectivity testing, and direct chat completions. They are also used internally by the `model` node executor during flow runs.

**Use:**
- `GET /api/v1/llm/models?provider=ollama` — populates the model picker dropdown in the `model` node's configuration panel. Call with different `provider` values to list models for each connected LLM backend.
- `POST /api/v1/llm/test` — called from the Settings / Provider Config screen when the user clicks "Test Connection". Verifies credentials and reachability without sending a real chat message. Returns `{"status": "ok"}` on success.
- `POST /api/v1/llm/chat` — used for the built-in chat playground in the Designer, enabling users to test a model directly before embedding it in a flow. Can also be called programmatically to build LLM-powered features outside of the flow engine.

**Supported providers**: `ollama`, `azure_openai`, `bedrock`, `vertex_ai`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/llm/chat` | Send a chat completion request |
| `GET` | `/api/v1/llm/models?provider=ollama` | List available models for a provider |
| `POST` | `/api/v1/llm/test` | Test provider connectivity |

**Supported providers**: `ollama`, `azure_openai`, `bedrock`, `vertex_ai`

**Chat payload** (`POST /api/v1/llm/chat`):

```json
{
  "provider": "ollama",
  "model": "qwen3.6:27b",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

**Response**:

```json
{
  "response": "Hello! How can I help you today?"
}
```

**List models** (`GET /api/v1/llm/models?provider=ollama`):

```json
{
  "provider": "ollama",
  "models": ["qwen3.6:27b", "gemma4:latest", "deepseek-coder-v2:latest"]
}
```

**Test connectivity** (`POST /api/v1/llm/test`):

```json
{
  "provider": "ollama",
  "model": "qwen3.6:27b"
}
```

**Response**:

```json
{
  "status": "ok",
  "provider": "ollama"
}
```

---

### MCP Tools

**Functionality:** Integrates with external [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers. MCP servers expose callable tools (functions) that can be invoked by the `mcp_tool` node in a flow — for example, a web search tool, a database query tool, or a code execution sandbox. These endpoints let users register and inspect MCP servers without running a full flow.

**Use:**
- `POST /api/v1/mcp/test` — called from the MCP server configuration screen to verify the server URL is reachable before saving it. Optionally validates a specific tool name exists on the server.
- `GET /api/v1/mcp/servers/{server_url}/tools` — called when configuring an `mcp_tool` node to populate the tool picker dropdown. Returns the list of available tools with their names, descriptions, and input schemas so the user can select which tool to call and understand its parameters.

> **Note:** MCP endpoints require an external MCP server to be running. They will timeout or error if the target server URL is unreachable.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/mcp/test` | Test an MCP server connection |
| `GET` | `/api/v1/mcp/servers/{server_url}/tools` | List tools from an MCP server |

**Test MCP payload** (`POST /api/v1/mcp/test`):

```json
{
  "server_url": "http://localhost:3001/mcp",
  "tool_name": "search"
}
```

**List tools response**:

```json
{
  "tools": [
    {
      "name": "search",
      "description": "Search the web",
      "schema": {"type": "object", "properties": {"query": {"type": "string"}}}
    }
  ]
}
```

---

### Knowledge Bases

**Functionality:** Manages named vector knowledge bases used for Retrieval-Augmented Generation (RAG). A knowledge base (KB) is a configuration record that maps to a Qdrant vector collection. It defines how documents are chunked, which embedding model encodes them, and how vectors are stored. Creating a KB provisions the collection in Qdrant; deleting it removes the collection and all associated document records.

**Use:**
- `POST /api/v1/knowledge-bases` — called when a user creates a new KB from the Knowledge Base management screen. Specify the embedding model and dimensions to match your embedding provider (e.g., `text-embedding-ada-002` with 1536 dims for Azure OpenAI, or a local model with 384 dims for Ollama). **Requires Qdrant to be running.**
- `GET /api/v1/knowledge-bases` — populates the KB list in the management screen and the KB picker dropdown inside `rag_agent` node configuration.
- `GET /api/v1/knowledge-bases/{kb_id}` — fetches full details including `doc_count` to show ingestion progress.
- `PUT /api/v1/knowledge-bases/{kb_id}` — updates the display name or description. Embedding settings cannot be changed after creation (would invalidate existing vectors).
- `DELETE /api/v1/knowledge-bases/{kb_id}` — removes the KB, all document records, all chunk records, and the Qdrant collection. Irreversible.

> **Requires:** Qdrant running at `QDRANT_HOST:QDRANT_PORT` (default `localhost:6333`). Without Qdrant, `POST` returns 500.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/knowledge-bases` | List knowledge bases |
| `POST` | `/api/v1/knowledge-bases` | Create a knowledge base |
| `GET` | `/api/v1/knowledge-bases/{kb_id}` | Get KB details |
| `PUT` | `/api/v1/knowledge-bases/{kb_id}` | Update KB metadata |
| `DELETE` | `/api/v1/knowledge-bases/{kb_id}` | Delete KB and all documents |

**Create KB payload** (`POST /api/v1/knowledge-bases`):

```json
{
  "name": "Product Docs",
  "description": "Company product documentation",
  "embedding_model": "text-embedding-ada-002",
  "embedding_dims": 1536,
  "chunk_size": 512,
  "chunk_overlap": 50,
  "vectordb_provider": "qdrant",
  "vectordb_config": {}
}
```

**Response** (`KnowledgeBaseResponse`):

```json
{
  "id": "uuid",
  "name": "Product Docs",
  "description": "Company product documentation",
  "embedding_model": "text-embedding-ada-002",
  "embedding_dims": 1536,
  "chunk_size": 512,
  "chunk_overlap": 50,
  "vectordb_provider": "qdrant",
  "collection_name": "kb_uuid",
  "doc_count": 0,
  "created_at": "2026-05-25T10:00:00Z",
  "updated_at": "2026-05-25T10:00:00Z"
}
```

---

### Documents

**Functionality:** Handles document ingestion into a knowledge base. When a file is uploaded, the server parses it into text, splits it into overlapping chunks (using the KB's `chunk_size` / `chunk_overlap` settings), generates vector embeddings for each chunk, and stores them in Qdrant. The upload returns immediately (202) and processing runs asynchronously; poll the document status until it reaches `ready`.

**Use:**
- `POST .../documents` — called from the KB document upload dialog. Send the file as `multipart/form-data`. The document moves through statuses: `pending` → `processing` → `ready` (or `error` on failure).
- `GET .../documents` — lists all documents in a KB with their ingestion status. Used to show the document table in the KB management screen, including processing progress.
- `GET .../documents/{doc_id}` — fetches full metadata for a single document: page count, chunk count, file size, and any error message if ingestion failed.
- `DELETE .../documents/{doc_id}` — removes the document record, all its chunk records from the database, and the corresponding vectors from Qdrant. Used when the user removes a document from a KB.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/knowledge-bases/{kb_id}/documents` | Upload a document (multipart/form-data) |
| `GET` | `/api/v1/knowledge-bases/{kb_id}/documents` | List documents in a KB |
| `GET` | `/api/v1/knowledge-bases/{kb_id}/documents/{doc_id}` | Get document details |
| `DELETE` | `/api/v1/knowledge-bases/{kb_id}/documents/{doc_id}` | Delete a document |

**Upload** (`POST`, Content-Type: `multipart/form-data`):

```
file: <binary file data>
```

Supported formats: `.pdf`, `.docx`, `.txt`, `.md`, `.csv`, `.html`, `.json`

**Response** (202 Accepted):

```json
{
  "id": "uuid",
  "kb_id": "uuid",
  "filename": "user-guide.pdf",
  "file_type": "pdf",
  "file_size": 1048576,
  "status": "processing",
  "page_count": null,
  "chunk_count": null,
  "error_message": null,
  "created_at": "2026-05-25T10:00:00Z"
}
```

Document statuses: `pending` → `processing` → `ready` | `error`

---

### RAG Query

**Functionality:** Executes a full Retrieval-Augmented Generation pipeline in a single call — without needing to build a flow. Given a natural language query and one or more knowledge base IDs, it: (1) embeds the query, (2) performs a similarity search in Qdrant to retrieve the top-K most relevant document chunks, (3) assembles them into a context prompt, and (4) calls the specified LLM to generate a grounded answer. Optionally returns the source chunks with relevance scores.

**Use:**
- Called directly from a RAG playground / test screen to validate that a KB is correctly indexed and returning relevant content before embedding it in a flow.
- Used by the `rag_agent` node executor internally during flow execution.
- Pass `include_sources: true` to inspect which document chunks were retrieved and their relevance scores — useful for debugging poor RAG quality.
- Adjust `top_k` (number of chunks) and `score_threshold` (minimum similarity) to tune retrieval precision vs. recall.
- Provide a `system_prompt` to control how the LLM uses the retrieved context (e.g., "Answer only from the provided context. If unsure, say I don't know.").

> **Requires:** A knowledge base with at least one ingested document and Qdrant running. Pass a valid KB UUID in `knowledge_base_ids`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/rag/query` | Retrieve context and generate answer |

**Payload** (`POST /api/v1/rag/query`):

```json
{
  "query": "How do I reset my password?",
  "knowledge_base_ids": ["kb-uuid-1"],
  "llm_provider": "ollama",
  "llm_model": "qwen3.6:27b",
  "top_k": 5,
  "score_threshold": 0.7,
  "system_prompt": "Answer based only on the provided context.",
  "include_sources": true,
  "stream": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | yes | User question |
| `knowledge_base_ids` | string[] | yes | KBs to search |
| `llm_provider` | string | yes | Provider for answer generation |
| `llm_model` | string | yes | Model name |
| `top_k` | int | no | Max chunks to retrieve (default 5) |
| `score_threshold` | float | no | Min relevance score (default 0.7) |
| `system_prompt` | string | no | Custom system prompt |
| `include_sources` | bool | no | Include source chunks in response |
| `stream` | bool | no | Stream response (future) |

**Response**:

```json
{
  "answer": "To reset your password, go to Settings > Security > Change Password.",
  "sources": [
    {
      "chunk_id": "uuid",
      "document_id": "uuid",
      "filename": "user-guide.pdf",
      "page_number": 12,
      "content": "Navigate to Settings, then Security...",
      "relevance_score": 0.92
    }
  ],
  "metadata": {
    "total_chunks_searched": 150,
    "chunks_returned": 3,
    "llm_provider": "ollama",
    "llm_model": "qwen3.6:27b"
  }
}
```

---

### Memory

**Functionality:** Manages conversation history (short-term memory) scoped to a flow and optionally a session. Memory is stored as an ordered list of `{role, content}` message entries in the `memories` table. During flow execution, if the flow has a `memory` node, it reads prior turns from this store and injects them into the LLM context, enabling multi-turn conversations. Memory is keyed by `flow_id` + optional `session_id`, so multiple independent sessions can share the same flow without interfering with each other.

**Use:**
- `GET /api/v1/memory/{flow_id}` — read back all conversation turns for a flow (+ session). Used by the `memory` executor node at the start of a flow run to inject prior context into the prompt. Also used by the chat UI to render conversation history.
- `POST /api/v1/memory/{flow_id}` — append a new message turn (user or assistant) to the memory store. Called by the `memory` executor after each flow run to record the user input and the generated response for future turns.
- `DELETE /api/v1/memory/{flow_id}` — clears all memory entries for a flow (+ session). Use this from the UI's "Clear conversation" button, or call it in tests to reset state between runs. Pass `?session_id=...` to clear only a specific session.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/memory/{flow_id}` | Load memory entries |
| `POST` | `/api/v1/memory/{flow_id}` | Append a message to memory |
| `DELETE` | `/api/v1/memory/{flow_id}` | Clear memory |

**Query parameter**: `session_id` (optional — scopes memory to a specific session)

**Append payload** (`POST /api/v1/memory/{flow_id}`):

```json
{
  "role": "user",
  "content": "What did we discuss earlier?",
  "session_id": "session-123"
}
```

**Response** (`MemoryResponse`):

```json
{
  "flow_id": "uuid",
  "session_id": "session-123",
  "entries": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi! How can I help?"},
    {"role": "user", "content": "What did we discuss earlier?"}
  ],
  "updated_at": "2026-05-25T10:00:00Z"
}
```

---

### WebSocket

**Functionality:** Provides a real-time event stream for a single flow execution. After triggering a run with `POST .../run`, the client opens a WebSocket connection using the returned `execution_id`. The server pushes structured JSON events as the flow progresses node-by-node: when execution starts, when each node begins and completes (with its output), on node errors, and when the full execution finishes or fails. The connection closes automatically when the execution reaches a terminal state (`completed`, `error`, or `stopped`).

**Use:**
- Connect immediately after calling `POST .../run` to stream live progress in the Designer's execution panel — showing which nodes are running, their outputs, and any errors without polling.
- Use `node_completed` events to render intermediate outputs as each node finishes (e.g., show the prompt template output before the LLM responds).
- Use `execution_completed` to capture the final output and update the chat display.
- Fall back to polling `GET /api/v1/executions/{id}` if WebSocket is unavailable (e.g., behind a proxy that doesn't support upgrade).

> **Note:** In V1, WebSocket fan-out uses an in-process `asyncio.Queue`. For multi-instance deployments, a shared pub/sub backend (Valkey / KeyDB) is needed.

| Protocol | Path |
|----------|------|
| WS | `ws://127.0.0.1:8180/api/v1/ws/executions/{execution_id}` |

Connect to receive real-time execution events. Messages sent from server:

```json
{"event": "execution_started", "execution_id": "uuid"}
{"event": "node_started", "execution_id": "uuid", "node_id": "n1", "node_type": "chat_input"}
{"event": "node_completed", "execution_id": "uuid", "node_id": "n1", "node_type": "chat_input", "output": {"message": "Hello"}}
{"event": "node_error", "execution_id": "uuid", "node_id": "n3", "error": "Model timeout"}
{"event": "execution_completed", "execution_id": "uuid", "output": {"output": "..."}}
{"event": "execution_error", "execution_id": "uuid", "error": "..."}
```

**JavaScript client example**:

```javascript
const ws = new WebSocket(`ws://127.0.0.1:8180/api/v1/ws/executions/${executionId}`);
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.event, data);
};
```

---

## Request/Response Payloads

### Flow Schemas

| Schema | Fields |
|--------|--------|
| `FlowCreate` | `name` (required), `description?`, `nodes[]`, `edges[]`, `tags[]` |
| `FlowUpdate` | `name?`, `description?`, `nodes?`, `edges?`, `tags?` |
| `FlowResponse` | `id`, `name`, `description`, `nodes`, `edges`, `tags`, `created_at`, `updated_at` |

### Execution Schemas

| Schema | Fields |
|--------|--------|
| `ExecutionRunRequest` | `message` (required), `session_id?`, `variables?` |
| `ExecutionResponse` | `id`, `flow_id`, `status`, `started_at`, `completed_at`, `input`, `output`, `error`, `created_at` |
| `ExecutionLogResponse` | `id`, `execution_id`, `node_id`, `level`, `message`, `detail`, `timestamp` |

### Knowledge Base Schemas

| Schema | Fields |
|--------|--------|
| `KnowledgeBaseCreate` | `name`, `description?`, `embedding_model`, `embedding_dims`, `chunk_size`, `chunk_overlap`, `vectordb_provider`, `vectordb_config` |
| `KnowledgeBaseUpdate` | `name?`, `description?` |
| `KnowledgeBaseResponse` | `id`, `name`, `description`, `embedding_model`, `embedding_dims`, `chunk_size`, `chunk_overlap`, `vectordb_provider`, `collection_name`, `doc_count`, `created_at`, `updated_at` |

### Document Schema

| Schema | Fields |
|--------|--------|
| `DocumentResponse` | `id`, `kb_id`, `filename`, `file_type`, `file_size`, `status`, `page_count`, `chunk_count`, `error_message`, `created_at` |

### RAG Schema

| Schema | Fields |
|--------|--------|
| `RAGQueryRequest` | `query`, `knowledge_base_ids[]`, `llm_provider`, `llm_model`, `top_k?`, `score_threshold?`, `system_prompt?`, `include_sources?`, `stream?` |
| `RAGQueryResponse` | `answer`, `sources[]`, `metadata` |

---

## Execution Engine (LangGraph)

The flow execution engine uses **LangGraph** (MIT) to compile flow JSON into a stateful graph and execute nodes in dependency order.

### How it works

1. `POST /api/v1/executions/flows/{flow_id}/run` creates an execution record (status: `pending`) and dispatches a background task.
2. The background task loads the flow's nodes/edges, compiles them into a **LangGraph StateGraph** via `compile_flow()`.
3. Each flow node becomes a LangGraph node function that:
   - Resolves inputs from upstream nodes via edge connections
   - Calls the appropriate executor (`ModelExecutor`, `PromptExecutor`, etc.)
   - Writes output to shared state
   - Broadcasts real-time events over WebSocket
4. LangGraph handles topological ordering, parallel execution of independent branches, and state management.
5. On completion, the execution record is updated with final output.

### State Schema

```python
class AgentFlowState(TypedDict):
    node_outputs: dict[str, Any]   # keyed by node_id
    execution_id: str
    context: dict[str, Any]        # flow_id, session_id, input, db
    error: str | None              # set on first node failure
```

### Key Files

| File | Purpose |
|------|---------|
| `app/engine/compiler.py` | Compiles flow JSON → LangGraph CompiledGraph |
| `app/engine/runner.py` | Orchestrates execution, manages WebSocket connections |
| `app/engine/graph.py` | DAG utilities (adjacency, topological sort, input resolution) |
| `app/engine/executors/` | Node type implementations (model, prompt, etc.) |
| `app/engine/connectors/` | LLM provider connectors (Ollama, Azure, Bedrock, Vertex) |

---

## Database Schema

6 tables managed by SQLAlchemy 2.0 (async):

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `flows` | id, name, description, nodes (JSON), edges (JSON), tags (JSON), created_at, updated_at | Core flow definitions |
| `executions` | id, flow_id (FK→flows), status, started_at, completed_at, input (JSON), output (JSON), error, created_at | Flow run records |
| `execution_logs` | id, execution_id (FK→executions), node_id, level, message, detail (JSON), timestamp | Per-node execution logs |
| `knowledge_bases` | id, name, description, embedding_model, embedding_dims, chunk_size, chunk_overlap, vectordb_provider, vectordb_config (JSON), collection_name, doc_count, created_at, updated_at | RAG knowledge bases |
| `documents` | id, kb_id (FK→knowledge_bases), filename, file_type, file_size, status, page_count, chunk_count, error_message, metadata (JSON), created_at | Uploaded documents |
| `document_chunks` | id, document_id (FK→documents), chunk_index, content, token_count, metadata (JSON), vector_point_id, created_at | Parsed/chunked text |
| `memories` | id, flow_id (FK→flows), session_id, entries (JSON), created_at, updated_at | Conversation memory |

**Cascade deletes**: flow → executions → execution_logs; knowledge_base → documents → document_chunks

**Execution statuses**: `pending`, `running`, `completed`, `error`, `stopped`

**Document statuses**: `pending`, `processing`, `ready`, `error`

---

## Testing

### LangGraph integration tests

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
.\.venv\Scripts\python.exe test_langgraph.py
```

Tests: compiler imports, StateGraph structure, E2E execution via API, invalid node rejection, cycle detection.

### Ollama LLM call tests

```powershell
# Full suite (requires Ollama + server running)
.\.venv\Scripts\python.exe test_ollama.py

# Override model
.\.venv\Scripts\python.exe test_ollama.py --model gemma4:latest

# Skip API tests (no server needed — tests connector and executor directly)
.\.venv\Scripts\python.exe test_ollama.py --skip-api
```

Tests:
1. `OllamaConnector.list_models()` — verifies Ollama is reachable and model exists
2. `OllamaConnector.chat()` — direct LLM call
3. `ModelExecutor.execute()` — node-level execution through the connector
4. Full API E2E — create flow → run → poll → verify LLM output + logs

---

## Project Structure

```
backend/
├── run.py                    # Entry point — starts uvicorn on :8180
├── app/
│   ├── main.py               # FastAPI app factory + lifespan
│   ├── config.py             # Settings from .env (Pydantic BaseSettings)
│   ├── dependencies.py       # DB / Qdrant dependency injectors
│   ├── api/
│   │   ├── health.py         # /health, /health/ready
│   │   └── v1/
│   │       ├── router.py     # Aggregates all v1 routers
│   │       ├── flows.py
│   │       ├── executions.py
│   │       ├── nodes.py
│   │       ├── llm.py
│   │       ├── knowledge_bases.py
│   │       ├── documents.py
│   │       ├── rag.py
│   │       ├── mcp.py
│   │       ├── memory.py
│   │       └── websocket.py
│   ├── models/               # SQLAlchemy ORM models
│   ├── schemas/              # Pydantic request/response schemas
│   ├── services/             # Business logic layer
│   ├── engine/
│   │   ├── compiler.py       # Flow JSON → LangGraph StateGraph
│   │   ├── runner.py         # Execution orchestrator + WebSocket manager
│   │   ├── graph.py          # DAG utilities
│   │   ├── executors/        # Node type implementations
│   │   │   ├── chat_input.py
│   │   │   ├── prompt.py
│   │   │   ├── model.py
│   │   │   ├── mcp.py
│   │   │   ├── rag.py
│   │   │   ├── memory.py
│   │   │   └── chat_output.py
│   │   └── connectors/       # LLM provider clients
│   │       ├── ollama.py
│   │       ├── azure_openai.py
│   │       ├── bedrock.py
│   │       └── vertex_ai.py
│   ├── rag/                  # RAG pipeline (parser, chunker, embedder, retriever)
│   ├── vectordb/             # Vector store abstraction (Qdrant provider)
│   ├── core/                 # Exceptions, middleware, events
│   └── db/                   # SQLAlchemy session factory
├── .env                      # Local environment config (SQLite defaults)
├── .env.example              # Template for production config
├── requirements.txt          # Full production dependencies
├── requirements-local.txt    # Slim deps for local dev (SQLite, no qdrant-client)
├── pip.ini                   # Artifactory pip index (Infosys network)
├── test_langgraph.py         # LangGraph integration tests
└── test_ollama.py            # Ollama LLM call tests
```

---

## Running with PostgreSQL (Production)

1. Start PostgreSQL and Qdrant:

```powershell
docker-compose up -d postgres qdrant
```

2. Update `.env`:

```ini
DATABASE_URL=postgresql+asyncpg://agentflow:agentflow@localhost:5432/agentflow
QDRANT_HOST=localhost
QDRANT_PORT=6333
```

3. Run Alembic migrations:

```powershell
$env:PYTHONPATH = "."
.\.venv\Scripts\alembic.exe upgrade head
```

4. Start the server:

```powershell
py run.py
```

> **Note:** Redis is not used in V1. WebSocket fan-out uses an in-process `asyncio.Queue`. For V2/production-scale pub/sub, consider [Valkey](https://valkey.io/) (BSD-3) or [KeyDB](https://docs.keydb.dev/) (BSD-3).

---

## Dependency Notes (Infosys Artifactory)

Several packages are pinned due to Artifactory 403 blocks on specific versions:

| Package | Pinned Version | Reason |
|---------|---------------|--------|
| `h11` | `0.14.0` | 0.15.0 and 0.16.0 are 403 blocked |
| `httpcore` | `1.0.8` | 1.0.9 is 403 blocked |
| `colorama` | `0.4.4` | 0.4.5 and 0.4.6 are 403 blocked |
| `click` | `7.1.2` | click 8.x requires colorama>=0.4.6 |

To install packages on Infosys network:

```powershell
$env:PIP_CONFIG_FILE = ".\pip.ini"
.\.venv\Scripts\pip.exe install <package>
```


