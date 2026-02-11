from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth_dependencies import require_auth
from app.models.user import User
from app.models.event import Operation, OperationStatus
from app.schemas.operation import OperationCreate, OperationUpdate, OperationSignupCreate
from app.services.operation import OperationService

router = APIRouter(prefix="/operations", tags=["operations"])

@router.get("/", response_model=List[Operation])
async def get_all_operations(
    db: Annotated[AsyncSession, Depends(get_db)],
    status: Optional[OperationStatus] = None
):
    """Retrieve a list of all operations."""
    service = OperationService(db)
    operations = await service.get_operations(status=status)
    return operations

@router.get("/{operation_id}", response_model=Operation)
async def get_operation_by_id(
    operation_id: int,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Retrieve a single operation by its ID."""
    service = OperationService(db)
    operation = await service.get_operation(operation_id)
    if not operation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operation not found")
    return operation

@router.post("/", response_model=Operation, status_code=status.HTTP_201_CREATED)
async def create_new_operation(
    operation: OperationCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)]
):
    """Create a new operation."""
    service = OperationService(db)
    new_operation = await service.create_operation(operation, user.id)
    await db.commit()
    return new_operation

@router.put("/{operation_id}", response_model=Operation)
async def update_existing_operation(
    operation_id: int,
    operation: OperationUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)]
):
    """Update an existing operation."""
    service = OperationService(db)
    existing_operation = await service.get_operation(operation_id)
    if not existing_operation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operation not found")
    
    # Basic authorization: Only creator can update
    if existing_operation.created_by_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this operation")
        
    updated_operation = await service.update_operation(operation_id, operation)
    await db.commit()
    return updated_operation

@router.delete("/{operation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_operation(
    operation_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)]
):
    """Delete an existing operation."""
    service = OperationService(db)
    existing_operation = await service.get_operation(operation_id)
    if not existing_operation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operation not found")

    # Basic authorization: Only creator can delete
    if existing_operation.created_by_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this operation")

    await service.delete_operation(operation_id)
    await db.commit()
    return

@router.post("/{operation_id}/signup", response_model=Operation)
async def signup_for_operation_endpoint(
    operation_id: int,
    signup_data: Optional[OperationSignupCreate] = None,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)]
):
    """Sign up for an operation."""
    service = OperationService(db)
    
    # Check if operation exists
    operation = await service.get_operation(operation_id)
    if not operation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operation not found")

    ship_id = signup_data.ship_id if signup_data else None
    role_preference = signup_data.role_preference if signup_data else None

    participant = await service.signup_user(operation_id, user.id, ship_id=ship_id, role_pref=role_preference)
    
    if not participant:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already signed up for this operation")
    
    await db.commit()
    # Return the updated operation object
    updated_operation = await service.get_operation(operation_id)
    return updated_operation

@router.post("/{operation_id}/cancel", response_model=Operation)
async def cancel_operation_signup_endpoint(
    operation_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_auth)]
):
    """Cancel signup for an operation."""
    service = OperationService(db)
    
    # Check if operation exists
    operation = await service.get_operation(operation_id)
    if not operation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operation not found")
        
    await service.cancel_signup(operation_id, user.id)
    await db.commit()
    # Return the updated operation object
    updated_operation = await service.get_operation(operation_id)
    return updated_operation
