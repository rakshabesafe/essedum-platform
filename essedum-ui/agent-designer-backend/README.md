# AgentFlow Designer — Backend API

FastAPI backend for the AgentFlow Designer. Supports flow authoring, execution, RAG pipelines, MCP tool integration, and multi-provider LLM connectivity.

---

## Requirements

| Tool | Version |
|------|---------|
| Python | 3.11 or 3.14 |
| pip | latest |
| Redis | optional (health check degrades gracefully) |
| Qdrant | optional (RAG endpoints only) |

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

### 4. Configure environment

The `.env` file is already present with SQLite defaults. No changes needed for local smoke testing.

To fill in LLM provider credentials, edit `.env`:

```ini
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

The server starts at **http://127.0.0.1:8180**.

On first startup, all database tables are created automatically in `agentflow-local.db`.

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `false` | Enables SQLAlchemy query logging |
| `DATABASE_URL` | `sqlite+aiosqlite:///./agentflow-local.db` | Database URL. Use `postgresql+asyncpg://...` in production |
| `REDIS_URL` | `redis://localhost:6379` | Redis URL. App starts without Redis; affected endpoints return degraded status |
| `QDRANT_HOST` | `localhost` | Qdrant server host |
| `QDRANT_PORT` | `6333` | Qdrant server port |
| `QDRANT_API_KEY` | _(empty)_ | Qdrant API key (Qdrant Cloud only) |
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

Auto-generated interactive docs:
- **Swagger UI** → http://127.0.0.1:8180/docs
- **ReDoc** → http://127.0.0.1:8180/redoc

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness — returns `{"status": "ok"}` |
| `GET` | `/health/ready` | Readiness — checks DB and Redis |

### Flows

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/flows` | List all flows (`?skip=0&limit=50`) |
| `POST` | `/api/v1/flows` | Create a new flow |
| `GET` | `/api/v1/flows/{flow_id}` | Get a flow by ID |
| `PUT` | `/api/v1/flows/{flow_id}` | Update flow graph or metadata |
| `DELETE` | `/api/v1/flows/{flow_id}` | Delete a flow |

### Executions

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/executions/flows/{flow_id}/run` | Run a flow asynchronously |
| `GET` | `/api/v1/executions` | List executions (`?flow_id=...&skip=0&limit=50`) |
| `GET` | `/api/v1/executions/{execution_id}` | Get execution status and output |
| `GET` | `/api/v1/executions/{execution_id}/logs` | Get execution logs |
| `POST` | `/api/v1/executions/{execution_id}/stop` | Stop a running execution |

### Node Registry

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/nodes` | List all V1 node type definitions |
| `GET` | `/api/v1/nodes/{node_type}` | Get schema for a specific node type |

V1 node types: `chat_input`, `prompt_template`, `model`, `mcp_tool`, `rag_agent`, `memory`, `chat_output`

### LLM Connectors

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/llm/chat` | Send chat completion to a provider |
| `GET` | `/api/v1/llm/models?provider=azure_openai` | List available models for a provider |
| `POST` | `/api/v1/llm/test` | Test provider connectivity |

Supported providers: `azure_openai`, `bedrock`, `vertex_ai`

### MCP Tools

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/mcp/test` | Test an MCP server connection |
| `GET` | `/api/v1/mcp/servers/{server_url}/tools` | List tools from an MCP server |

### Knowledge Bases

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/knowledge-bases` | List knowledge bases |
| `POST` | `/api/v1/knowledge-bases` | Create a knowledge base |
| `GET` | `/api/v1/knowledge-bases/{kb_id}` | Get KB details |
| `PUT` | `/api/v1/knowledge-bases/{kb_id}` | Update KB metadata |
| `DELETE` | `/api/v1/knowledge-bases/{kb_id}` | Delete KB and all associated data |

### Documents

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/knowledge-bases/{kb_id}/documents` | Upload a document (multipart/form-data) |
| `GET` | `/api/v1/knowledge-bases/{kb_id}/documents` | List documents in a KB |
| `GET` | `/api/v1/knowledge-bases/{kb_id}/documents/{doc_id}` | Get document details |
| `DELETE` | `/api/v1/knowledge-bases/{kb_id}/documents/{doc_id}` | Delete a document |

Supported file types: `.pdf`, `.docx`, `.txt`, `.md`, `.csv`, `.html`, `.json`

### RAG Query

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/rag/query` | RAG query — retrieve chunks and generate answer |

### Memory

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/memory/{flow_id}` | Load memory for a flow/session |
| `POST` | `/api/v1/memory/{flow_id}` | Append a message entry to memory |
| `DELETE` | `/api/v1/memory/{flow_id}` | Clear memory for a flow/session |

### WebSocket

| Path | Description |
|------|-------------|
| `ws://127.0.0.1:8180/api/v1/ws/executions/{execution_id}` | Real-time execution event stream |

WebSocket message types sent from server to client:

```json
{ "type": "node_started",       "node_id": "...", "timestamp": "..." }
{ "type": "node_completed",     "node_id": "...", "output": {}, "timestamp": "..." }
{ "type": "node_error",         "node_id": "...", "error": "...", "timestamp": "..." }
{ "type": "log",                "level": "info",  "message": "..." }
{ "type": "execution_completed","status": "completed", "duration_ms": 1234 }
```

---

## Postman Collection

Import `AgentFlow-API.postman_collection.json` into Postman.

**Collection variables** (set automatically by test scripts):

| Variable | Set by |
|----------|--------|
| `base_url` | Pre-set to `http://127.0.0.1:8180` |
| `flow_id` | Auto-saved when Create Flow succeeds (201) |
| `execution_id` | Auto-saved when Run Flow succeeds (202) |
| `kb_id` | Auto-saved when Create Knowledge Base succeeds (201) |
| `document_id` | Auto-saved when Upload Document succeeds (202) |

**Recommended test order:**
1. Health → Liveness Check
2. Health → Readiness Check
3. Node Registry → List V1 Node Types
4. Flows → Create Flow *(saves `flow_id`)*
5. Flows → List Flows
6. Flows → Get Flow
7. Flows → Update Flow
8. Executions → Run Flow *(saves `execution_id`)*
9. Executions → Get Execution
10. Executions → Get Execution Logs
11. LLM → Chat Completion *(requires provider credentials in `.env`)*
12. Knowledge Bases → Create Knowledge Base *(saves `kb_id`)*
13. Documents → Upload Document *(saves `document_id`)*
14. RAG → RAG Query *(requires Qdrant + LLM credentials)*

---

## Project Structure

```
backend/
├── app/
│   ├── main.py               # FastAPI app factory + lifespan
│   ├── config.py             # Settings from .env (Pydantic BaseSettings)
│   ├── dependencies.py       # DB / Redis / Qdrant dependency injectors
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
│   ├── engine/               # Flow execution engine + node executors
│   ├── rag/                  # RAG pipeline (parser, chunker, embedder, retriever)
│   ├── vectordb/             # Vector store abstraction (Qdrant provider)
│   ├── core/                 # Exceptions, middleware, events
│   └── db/                   # SQLAlchemy session factory
├── .env                      # Local environment config (SQLite)
├── .env.example              # Template for production config
├── requirements-local.txt    # Slim deps for local dev (SQLite, no qdrant-client)
├── requirements.txt          # Full production deps
├── pip.ini                   # Artifactory pip index (Infosys network)
├── AgentFlow-API.postman_collection.json
└── README.md
```

---

## Dependency Notes (Infosys Artifactory)

Several packages are pinned due to Artifactory 403 blocks on specific versions:

| Package | Pinned Version | Reason |
|---------|---------------|--------|
| `h11` | `0.14.0` | 0.15.0 and 0.16.0 are 403 blocked |
| `httpcore` | `1.0.8` | 1.0.9 is 403 blocked |
| `colorama` | `0.4.4` | 0.4.5 and 0.4.6 are 403 blocked |
| `click` | `7.1.2` | click 8.x requires colorama>=0.4.6 |
| `qdrant-client` | not installed | pulls `hyperframe==6.1.0` which is 403 blocked |
| `langchain-text-splitters` | not installed | pulls `jsonpatch==1.33` which is 403 blocked |

The chunker uses a native Python implementation instead of LangChain. Qdrant imports are guarded lazily — the app starts and runs without `qdrant-client` installed; only RAG endpoints that actually call Qdrant will fail.

To install `qdrant-client` when it becomes available in Artifactory:

```powershell
pip install qdrant-client
```

---

## Running with PostgreSQL (Production-like)

1. Start PostgreSQL and Redis (see `docker-compose.yml`):

```powershell
docker-compose up -d postgres redis qdrant
```

2. Update `.env`:

```ini
DATABASE_URL=postgresql+asyncpg://agentflow:agentflow@localhost:5432/agentflow
REDIS_URL=redis://localhost:6379
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
