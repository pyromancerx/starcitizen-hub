# app/routers/wallet.py
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_approved_user
from app.models.user import User
from app.schemas.wallet import (
    WalletResponse,
    WalletTransactionCreate,
    WalletTransactionResponse,
    WalletWithTransactions,
    TransferRequest,
)
from app.services.wallet import WalletService

router = APIRouter(prefix="/api/wallet", tags=["wallet"])


@router.get("/", response_model=WalletResponse)
async def get_my_wallet(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get the current user's wallet, creating one if it doesn't exist."""
    service = WalletService(db)
    wallet = await service.get_or_create_wallet(current_user.id)
    return wallet


@router.get("/balance")
async def get_balance(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get the current user's wallet balance."""
    service = WalletService(db)
    balance = await service.get_balance(current_user.id)
    return {"balance_auec": balance}


@router.get("/details", response_model=WalletWithTransactions)
async def get_wallet_with_transactions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    transaction_limit: int = Query(10, ge=1, le=100),
):
    """Get wallet with recent transactions."""
    service = WalletService(db)
    wallet = await service.get_or_create_wallet(current_user.id)
    transactions = await service.get_transactions(wallet.id, limit=transaction_limit)

    return WalletWithTransactions(
        id=wallet.id,
        user_id=wallet.user_id,
        balance_auec=wallet.balance_auec,
        last_updated_at=wallet.last_updated_at,
        recent_transactions=transactions,
    )


@router.post("/deposit", response_model=WalletTransactionResponse, status_code=status.HTTP_201_CREATED)
async def deposit(
    amount: int = Query(..., gt=0, description="Amount to deposit"),
    description: str = Query(None, max_length=500),
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: Annotated[User, Depends(get_current_approved_user)] = None,
):
    """Deposit funds into the current user's wallet."""
    service = WalletService(db)
    wallet = await service.get_or_create_wallet(current_user.id)
    try:
        transaction = await service.deposit(wallet, amount, "deposit", description)
        return transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/withdraw", response_model=WalletTransactionResponse, status_code=status.HTTP_201_CREATED)
async def withdraw(
    amount: int = Query(..., gt=0, description="Amount to withdraw"),
    description: str = Query(None, max_length=500),
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    current_user: Annotated[User, Depends(get_current_approved_user)] = None,
):
    """Withdraw funds from the current user's wallet."""
    service = WalletService(db)
    wallet = await service.get_or_create_wallet(current_user.id)
    try:
        transaction = await service.withdraw(wallet, amount, "withdrawal", description)
        return transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/transfer", response_model=WalletTransactionResponse, status_code=status.HTTP_201_CREATED)
async def transfer(
    transfer_request: TransferRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Transfer funds to another user's wallet."""
    service = WalletService(db)

    from_wallet = await service.get_or_create_wallet(current_user.id)
    to_wallet = await service.get_wallet_by_user_id(transfer_request.recipient_user_id)

    if not to_wallet:
        # Create wallet for recipient if they don't have one
        to_wallet = await service.get_or_create_wallet(transfer_request.recipient_user_id)

    try:
        from_tx, to_tx = await service.transfer(
            from_wallet,
            to_wallet,
            transfer_request.amount,
            transfer_request.description,
        )
        return from_tx  # Return sender's transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/transactions", response_model=WalletTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    data: WalletTransactionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Create a transaction (deposit or withdrawal based on amount sign)."""
    service = WalletService(db)
    wallet = await service.get_or_create_wallet(current_user.id)
    try:
        transaction = await service.create_transaction(wallet, data)
        return transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/transactions", response_model=List[WalletTransactionResponse])
async def list_transactions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """List all transactions for the current user's wallet."""
    service = WalletService(db)
    wallet = await service.get_wallet_by_user_id(current_user.id)
    if not wallet:
        return []
    transactions = await service.get_transactions(wallet.id, skip, limit)
    return transactions


@router.get("/transactions/{transaction_id}", response_model=WalletTransactionResponse)
async def get_transaction(
    transaction_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_approved_user)],
):
    """Get a specific transaction by ID."""
    service = WalletService(db)
    transaction = await service.get_transaction_by_id(transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    # Verify the transaction belongs to the user's wallet
    wallet = await service.get_wallet_by_user_id(current_user.id)
    if not wallet or transaction.wallet_id != wallet.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this transaction",
        )

    return transaction
