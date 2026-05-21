from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.schemas.flow import FlowCreate, FlowUpdate, FlowResponse
from app.services.flow_service import (
    list_flows, get_flow, create_flow, update_flow, delete_flow,
)

router = APIRouter(prefix="/flows", tags=["flows"])


@router.get("", response_model=List[FlowResponse])
async def list_flows_endpoint(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    return await list_flows(db, skip=skip, limit=limit)


@router.post("", response_model=FlowResponse, status_code=status.HTTP_201_CREATED)
async def create_flow_endpoint(
    data: FlowCreate,
    db: AsyncSession = Depends(get_db),
):
    return await create_flow(db, data)


@router.get("/{flow_id}", response_model=FlowResponse)
async def get_flow_endpoint(flow_id: str, db: AsyncSession = Depends(get_db)):
    return await get_flow(db, flow_id)


@router.put("/{flow_id}", response_model=FlowResponse)
async def update_flow_endpoint(
    flow_id: str,
    data: FlowUpdate,
    db: AsyncSession = Depends(get_db),
):
    return await update_flow(db, flow_id, data)


@router.delete("/{flow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flow_endpoint(flow_id: str, db: AsyncSession = Depends(get_db)):
    await delete_flow(db, flow_id)
