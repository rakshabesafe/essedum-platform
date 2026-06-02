from typing import Any

from app.vectordb.base import VectorStoreProvider, VectorPoint, SearchResult, CollectionStats
from app.config import settings


class QdrantProvider(VectorStoreProvider):
    """Qdrant implementation of VectorStoreProvider (V1)."""

    def __init__(self, config: dict):
        from qdrant_client import AsyncQdrantClient  # lazy import
        from qdrant_client.models import Distance, VectorParams  # noqa: F401 — stored for later use

        host = config.get("host", settings.qdrant_host)
        port = config.get("port", settings.qdrant_port)
        api_key = config.get("api_key", settings.qdrant_api_key)
        prefer_grpc = config.get("prefer_grpc", settings.qdrant_use_grpc)

        self._client = AsyncQdrantClient(
            host=host,
            port=port,
            api_key=api_key,
            prefer_grpc=prefer_grpc,
        )

    async def create_collection(
        self, name: str, dimensions: int, metadata: dict | None = None
    ) -> None:
        from qdrant_client.models import Distance, VectorParams
        existing = await self._client.collection_exists(name)
        if not existing:
            await self._client.create_collection(
                collection_name=name,
                vectors_config=VectorParams(size=dimensions, distance=Distance.COSINE),
            )

    async def delete_collection(self, name: str) -> None:
        await self._client.delete_collection(collection_name=name)

    async def collection_info(self, name: str) -> CollectionStats:
        info = await self._client.get_collection(collection_name=name)
        return CollectionStats(
            name=name,
            vector_count=info.vectors_count or 0,
            dimensions=info.config.params.vectors.size,
        )

    async def upsert(self, collection: str, points: list[VectorPoint]) -> None:
        from qdrant_client.models import PointStruct
        structs = [
            PointStruct(id=p.id, vector=p.vector, payload=p.payload)
            for p in points
        ]
        await self._client.upsert(collection_name=collection, points=structs)

    async def search(
        self,
        collection: str,
        vector: list[float],
        top_k: int = 5,
        score_threshold: float = 0.0,
        filters: dict | None = None,
    ) -> list[SearchResult]:
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        qdrant_filter: Any = None
        if filters:
            conditions = [
                FieldCondition(key=k, match=MatchValue(value=v))
                for k, v in filters.items()
            ]
            qdrant_filter = Filter(must=conditions)

        hits = await self._client.search(
            collection_name=collection,
            query_vector=vector,
            limit=top_k,
            score_threshold=score_threshold if score_threshold > 0 else None,
            query_filter=qdrant_filter,
            with_payload=True,
        )
        return [
            SearchResult(id=str(h.id), score=h.score, payload=h.payload or {})
            for h in hits
        ]

    async def delete_points(self, collection: str, point_ids: list[str]) -> None:
        from qdrant_client.models import PointIdsList
        await self._client.delete(
            collection_name=collection,
            points_selector=PointIdsList(points=point_ids),
        )

    async def count(self, collection: str) -> int:
        result = await self._client.count(collection_name=collection)
        return result.count
