# app/routers/treasury.py
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user, require_permissions
from app.models.user import User
from app.models.treasury import TransactionType, TransactionStatus
from app.schemas.treasury import (
    WalletCreate, WalletUpdate, WalletResponse, WalletWithTransactions,
    TreasuryTransactionCreate, TreasuryTransactionResponse,
    TransactionFilter, TransactionApproval, TreasuryReport
)
from app.services.treasury import TreasuryService


router = APIRouter(prefix="/api/treasury", tags=["treasury"])


@router.get("/wallets", response_model=List[WalletResponse])
async def list_wallets(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """List all organization wallets."""
    service = TreasuryService(db)
    wallets = await service.get_wallets()
    return wallets


@router.post("/wallets", response_model=WalletResponse, status_code=status.HTTP_201_CREATED)
async def create_wallet(
    data: WalletCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permissions(["org.manage_treasury"]))],
):
    """Create a new organization wallet (admin only)."""
    service = TreasuryService(db)
    wallet = await service.create_wallet(
        name=data.name,
        description=data.description,
        is_primary=data.is_primary
    )
    return wallet


@router.get("/wallets/{wallet_id}", response_model=WalletWithTransactions)
async def get_wallet(
    wallet_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get a specific wallet with its transactions."""
    service = TreasuryService(db)
    wallet = await service.get_wallet(wallet_id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    transactions = await service.get_transactions(wallet_id, limit=limit, offset=offset)
    return WalletWithTransactions(
        id=wallet.id,
        name=wallet.name,
        description=wallet.description,
        balance=wallet.balance,
        is_primary=wallet.is_primary,
        created_at=wallet.created_at,
        updated_at=wallet.updated_at,
        transactions=transactions
    )


@router.put("/wallets/{wallet_id}", response_model=WalletResponse)
async def update_wallet(
    wallet_id: int,
    data: WalletUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permissions(["org.manage_treasury"]))],
):
    """Update wallet name and description (admin only)."""
    service = TreasuryService(db)
    try:
        wallet = await service.update_wallet(
            wallet_id=wallet_id,
            name=data.name,
            description=data.description
        )
        return wallet
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/wallets/{wallet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_wallet(
    wallet_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permissions(["org.manage_treasury"]))],
):
    """Delete an empty wallet (admin only)."""
    service = TreasuryService(db)
    try:
        await service.delete_wallet(wallet_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/wallets/{wallet_id}/transactions", response_model=TreasuryTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    wallet_id: int,
    data: TreasuryTransactionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Create a new transaction (deposit auto-approved, withdrawal pending)."""
    service = TreasuryService(db)
    try:
        transaction = await service.create_transaction(
            treasury_id=wallet_id,
            user_id=current_user.id,
            data=data
        )
        return transaction
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/wallets/{wallet_id}/transactions", response_model=List[TreasuryTransactionResponse])
async def list_transactions(
    wallet_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    type: Optional[TransactionType] = None,
    status: Optional[TransactionStatus] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List transactions for a wallet with optional filters."""
    service = TreasuryService(db)
    transactions = await service.get_transactions(
        treasury_id=wallet_id,
        limit=limit,
        offset=offset,
        type_filter=type,
        status_filter=status
    )
    return transactions


@router.get("/pending", response_model=List[TreasuryTransactionResponse])
async def get_pending_transactions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permissions(["org.manage_treasury"]))],
    wallet_id: Optional[int] = None,
):
    """Get all pending transactions requiring approval (admin only)."""
    service = TreasuryService(db)
    transactions = await service.get_pending_transactions(wallet_id)
    return transactions


@router.post("/transactions/{transaction_id}/approve", response_model=TreasuryTransactionResponse)
async def approve_transaction(
    transaction_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permissions(["org.manage_treasury"]))],
):
    """Approve a pending withdrawal transaction (admin only)."""
    service = TreasuryService(db)
    try:
        transaction = await service.approve_transaction(transaction_id, current_user.id)
        return transaction
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/transactions/{transaction_id}/reject", response_model=TreasuryTransactionResponse)
async def reject_transaction(
    transaction_id: int,
    data: TransactionApproval,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permissions(["org.manage_treasury"]))],
):
    """Reject a pending withdrawal transaction (admin only)."""
    service = TreasuryService(db)
    try:
        transaction = await service.reject_transaction(transaction_id, current_user.id)
        return transaction
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/wallets/{wallet_id}/reports/summary")
async def get_wallet_report(
    wallet_id: int,
    days: int = Query(30, ge=1, le=365),
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get financial report for a wallet."""
    service = TreasuryService(db)
    report = await service.get_report(wallet_id, days)
    return report
