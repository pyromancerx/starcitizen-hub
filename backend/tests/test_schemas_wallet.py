# tests/test_schemas_wallet.py
import pytest
from datetime import datetime
from pydantic import ValidationError
from app.schemas.wallet import (
    WalletResponse,
    WalletTransactionCreate,
    WalletTransactionResponse,
    WalletWithTransactions,
    TransferRequest,
)


def test_wallet_response():
    """Test wallet response schema."""
    response = WalletResponse(
        id=1,
        user_id=100,
        balance_auec=50000,
        last_updated_at=datetime.utcnow(),
    )
    assert response.id == 1
    assert response.user_id == 100
    assert response.balance_auec == 50000


def test_wallet_transaction_create_deposit():
    """Test wallet transaction create for deposit."""
    data = WalletTransactionCreate(
        amount=1000,
        transaction_type="deposit",
        description="Mining earnings",
    )
    assert data.amount == 1000
    assert data.transaction_type == "deposit"
    assert data.description == "Mining earnings"


def test_wallet_transaction_create_withdrawal():
    """Test wallet transaction create for withdrawal."""
    data = WalletTransactionCreate(
        amount=-500,
        transaction_type="withdrawal",
        description="Ship purchase",
    )
    assert data.amount == -500
    assert data.transaction_type == "withdrawal"


def test_wallet_transaction_create_minimal():
    """Test wallet transaction with minimal required fields."""
    data = WalletTransactionCreate(
        amount=100,
        transaction_type="misc",
    )
    assert data.amount == 100
    assert data.transaction_type == "misc"
    assert data.description is None


def test_wallet_transaction_create_empty_type_fails():
    """Test transaction with empty type fails."""
    with pytest.raises(ValidationError):
        WalletTransactionCreate(amount=100, transaction_type="")


def test_wallet_transaction_response():
    """Test wallet transaction response schema."""
    response = WalletTransactionResponse(
        id=1,
        wallet_id=100,
        amount=1500,
        transaction_type="mission_reward",
        description="Completed bounty mission",
        created_at=datetime.utcnow(),
    )
    assert response.id == 1
    assert response.wallet_id == 100
    assert response.amount == 1500


def test_wallet_with_transactions():
    """Test wallet with transactions response schema."""
    now = datetime.utcnow()
    transactions = [
        WalletTransactionResponse(
            id=1,
            wallet_id=100,
            amount=1000,
            transaction_type="deposit",
            created_at=now,
        ),
        WalletTransactionResponse(
            id=2,
            wallet_id=100,
            amount=-200,
            transaction_type="withdrawal",
            created_at=now,
        ),
    ]
    response = WalletWithTransactions(
        id=100,
        user_id=50,
        balance_auec=800,
        last_updated_at=now,
        recent_transactions=transactions,
    )
    assert response.id == 100
    assert response.balance_auec == 800
    assert len(response.recent_transactions) == 2


def test_transfer_request_valid():
    """Test valid transfer request schema."""
    data = TransferRequest(
        recipient_user_id=200,
        amount=500,
        description="Payment for cargo",
    )
    assert data.recipient_user_id == 200
    assert data.amount == 500
    assert data.description == "Payment for cargo"


def test_transfer_request_minimal():
    """Test transfer request with minimal fields."""
    data = TransferRequest(
        recipient_user_id=100,
        amount=100,
    )
    assert data.recipient_user_id == 100
    assert data.amount == 100
    assert data.description is None


def test_transfer_request_invalid_zero_amount():
    """Test transfer request fails with zero amount."""
    with pytest.raises(ValidationError):
        TransferRequest(
            recipient_user_id=100,
            amount=0,
        )


def test_transfer_request_invalid_negative_amount():
    """Test transfer request fails with negative amount."""
    with pytest.raises(ValidationError):
        TransferRequest(
            recipient_user_id=100,
            amount=-100,
        )


def test_transfer_request_invalid_recipient_id():
    """Test transfer request fails with invalid recipient ID."""
    with pytest.raises(ValidationError):
        TransferRequest(
            recipient_user_id=0,
            amount=100,
        )

    with pytest.raises(ValidationError):
        TransferRequest(
            recipient_user_id=-1,
            amount=100,
        )
