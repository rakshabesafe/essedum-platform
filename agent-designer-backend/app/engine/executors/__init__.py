from app.engine.executors.chat_input import ChatInputExecutor
from app.engine.executors.chat_output import ChatOutputExecutor
from app.engine.executors.prompt import PromptExecutor
from app.engine.executors.model import ModelExecutor
from app.engine.executors.mcp import MCPExecutor
from app.engine.executors.rag import RAGExecutor
from app.engine.executors.memory import MemoryExecutor

EXECUTOR_REGISTRY = {
    "chat_input": ChatInputExecutor(),
    "chat_output": ChatOutputExecutor(),
    "prompt_template": PromptExecutor(),
    "model": ModelExecutor(),
    "mcp_tool": MCPExecutor(),
    "rag_agent": RAGExecutor(),
    "memory": MemoryExecutor(),
}


def get_executor(node_type: str):
    if node_type not in EXECUTOR_REGISTRY:
        raise ValueError(
            f"Node type '{node_type}' is not supported in V1. "
            f"Supported: {sorted(EXECUTOR_REGISTRY)}"
        )
    return EXECUTOR_REGISTRY[node_type]
