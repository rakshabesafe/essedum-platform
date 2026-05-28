from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

    # Application
    app_name: str = "AgentFlow Designer API"
    app_version: str = "1.0.0"
    debug: bool = False
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Database
    database_url: str = (
        "postgresql+asyncpg://agentflow:agentflow@localhost:5432/agentflow"
    )

    # Qdrant (V1 — only supported vector store)
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_api_key: Optional[str] = None
    qdrant_use_grpc: bool = False

    # Azure OpenAI
    azure_openai_api_key: Optional[str] = None
    azure_openai_endpoint: Optional[str] = None
    azure_openai_api_version: str = "2024-02-01"

    # AWS Bedrock
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-east-1"

    # Google Vertex AI
    google_project_id: Optional[str] = None
    google_location: str = "us-central1"
    google_application_credentials: Optional[str] = None

    # Ollama (local LLM)
    ollama_base_url: str = "http://localhost:11434/v1"


settings = Settings()
