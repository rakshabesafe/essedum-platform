from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.schemas.knowledge_base import (
    KnowledgeBaseCreate, KnowledgeBaseUpdate, KnowledgeBaseResponse,
)
from app.services.knowledge_base_service import (
    list_knowledge_bases, get_knowledge_base,
    create_knowledge_base, update_knowledge_base, delete_knowledge_base,
)

router = APIRouter(prefix="/knowledge-bases", tags=["knowledge-bases"])


@router.get("", response_model=List[KnowledgeBaseResponse])
async def list_kbs(skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db)):
    return await list_knowledge_bases(db, skip=skip, limit=limit)


@router.post("", response_model=KnowledgeBaseResponse, status_code=status.HTTP_201_CREATED)
async def create_kb(data: KnowledgeBaseCreate, db: AsyncSession = Depends(get_db)):
    return await create_knowledge_base(db, data)


@router.get("/{kb_id}", response_model=KnowledgeBaseResponse)
async def get_kb(kb_id: str, db: AsyncSession = Depends(get_db)):
    return await get_knowledge_base(db, kb_id)


@router.put("/{kb_id}", response_model=KnowledgeBaseResponse)
async def update_kb(
    kb_id: str, data: KnowledgeBaseUpdate, db: AsyncSession = Depends(get_db)
):
    return await update_knowledge_base(db, kb_id, data)


@router.delete("/{kb_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_kb(kb_id: str, db: AsyncSession = Depends(get_db)):
    await delete_knowledge_base(db, kb_id)
