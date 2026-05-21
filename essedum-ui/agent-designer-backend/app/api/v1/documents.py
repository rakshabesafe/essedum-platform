from typing import List
from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.schemas.document import DocumentResponse
from app.services.document_service import (
    create_document, get_document, list_documents, delete_document,
)
from app.rag.ingestion import ingest_document

router = APIRouter(prefix="/knowledge-bases/{kb_id}/documents", tags=["documents"])


@router.get("", response_model=List[DocumentResponse])
async def list_docs(
    kb_id: str,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    return await list_documents(db, kb_id=kb_id, skip=skip, limit=limit)


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    kb_id: str,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    doc = await create_document(
        db=db,
        kb_id=kb_id,
        filename=file.filename or "upload",
        file_type=file.content_type or "application/octet-stream",
        file_size=len(content),
    )
    background_tasks.add_task(
        ingest_document,
        document_id=doc.id,
        filename=doc.filename,
        content=content,
        db=db,
    )
    return doc


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_doc(
    kb_id: str, document_id: str, db: AsyncSession = Depends(get_db)
):
    return await get_document(db, document_id)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doc(
    kb_id: str, document_id: str, db: AsyncSession = Depends(get_db)
):
    await delete_document(db, document_id)
