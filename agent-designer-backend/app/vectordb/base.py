from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class VectorPoint:
    id: str
    vector: list[float]
    payload: dict[str, Any] = field(default_factory=dict)


@dataclass
class SearchResult:
    id: str
    score: float
    payload: dict[str, Any] = field(default_factory=dict)


@dataclass
class CollectionStats:
    name: str
    vector_count: int
    dimensions: int


class VectorStoreProvider(ABC):
    """Abstract base for vector DB backends. V1 implementation: Qdrant."""

    @abstractmethod
    async def create_collection(
        self, name: str, dimensions: int, metadata: dict | None = None
    ) -> None: ...

    @abstractmethod
    async def delete_collection(self, name: str) -> None: ...

    @abstractmethod
    async def collection_info(self, name: str) -> CollectionStats: ...

    @abstractmethod
    async def upsert(self, collection: str, points: list[VectorPoint]) -> None: ...

    @abstractmethod
    async def search(
        self,
        collection: str,
        vector: list[float],
        top_k: int = 5,
        score_threshold: float = 0.0,
        filters: dict | None = None,
    ) -> list[SearchResult]: ...

    @abstractmethod
    async def delete_points(self, collection: str, point_ids: list[str]) -> None: ...

    @abstractmethod
    async def count(self, collection: str) -> int: ...
