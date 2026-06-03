from fastapi import APIRouter
from app.schemas.node import NODE_REGISTRY, V1_NODE_TYPES

router = APIRouter(prefix="/nodes", tags=["nodes"])


@router.get("")
async def list_nodes():
    return [
        {"type": k, **v.model_dump()}
        for k, v in NODE_REGISTRY.items()
        if k in V1_NODE_TYPES
    ]


@router.get("/{node_type}")
async def get_node(node_type: str):
    from app.core.exceptions import NotFoundError

    if node_type not in NODE_REGISTRY:
        raise NotFoundError(f"Node type '{node_type}' not found.")
    return {"type": node_type, **NODE_REGISTRY[node_type].model_dump()}
