# app/services/trade.py
from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy import select, desc, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.trade import TradeRun, PriceReport, CargoContract, ContractStatus
from app.models.ship import Ship
from app.schemas.trade import (
    TradeRunCreate,
    TradeRunUpdate,
    PriceReportCreate,
    CargoContractCreate,
    CargoContractUpdate,
)


class TradeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # === Trade Run Methods ===

    async def create_trade_run(
        self,
        user_id: int,
        data: TradeRunCreate,
    ) -> TradeRun:
        """Create a new trade run with calculated profit and track activity."""
        profit = data.sell_price - data.buy_price
        
        trade_run = TradeRun(
            user_id=user_id,
            ship_id=data.ship_id,
            origin_location=data.origin_location,
            destination_location=data.destination_location,
            commodity=data.commodity,
            quantity=data.quantity,
            buy_price_per_unit=data.buy_price / data.quantity,
            sell_price_per_unit=data.sell_price / data.quantity,
            profit=profit,
            notes=data.notes,
            completed_at=data.completed_at or datetime.utcnow(),
        )
        self.db.add(trade_run)
        await self.db.commit()
        await self.db.refresh(trade_run)
        
        # Track activity
        from app.services.activity import ActivityService
        activity_service = ActivityService(self.db)
        await activity_service.track_trade_completed(
            user_id=user_id,
            trade_id=trade_run.id,
            commodity=trade_run.commodity,
            profit=trade_run.profit
        )
        
        return trade_run

    async def get_trade_run_by_id(self, trade_run_id: int) -> Optional[TradeRun]:
        result = await self.db.execute(
            select(TradeRun).where(TradeRun.id == trade_run_id)
        )
        return result.scalar_one_or_none()

    async def get_user_trade_runs(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[TradeRun]:
        """Get trade runs for a user, ordered by most recent first."""
        result = await self.db.execute(
            select(TradeRun)
            .where(TradeRun.user_id == user_id)
            .order_by(desc(TradeRun.completed_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

from app.models.privacy import UserPrivacy  # Import UserPrivacy
from app.models.user import User # Import User

# ... existing code ...

    async def get_all_trade_runs(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> List[TradeRun]:
        """Get all trade runs, ordered by most recent first, respecting privacy settings."""
        query = select(TradeRun) \
            .join(User, TradeRun.user_id == User.id) \
            .outerjoin(UserPrivacy, User.id == UserPrivacy.user_id) \
            .where(
                (UserPrivacy.hide_trade_activity == False) | (UserPrivacy.hide_trade_activity == None)
            ) \
            .order_by(desc(TradeRun.completed_at)) \
            .offset(skip) \
            .limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

# ... rest of the existing code ...

    async def update_trade_run(
        self,
        trade_run: TradeRun,
        data: TradeRunUpdate,
    ) -> TradeRun:
        """Update a trade run and recalculate profit if prices changed."""
        update_data = data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(trade_run, field, value)
        
        # Recalculate profit if buy or sell price changed
        if data.buy_price is not None or data.sell_price is not None:
            buy = data.buy_price if data.buy_price is not None else trade_run.buy_price_per_unit * trade_run.quantity
            sell = data.sell_price if data.sell_price is not None else trade_run.sell_price_per_unit * trade_run.quantity
            trade_run.profit = sell - buy
        
        await self.db.commit()
        await self.db.refresh(trade_run)
        return trade_run

    async def delete_trade_run(self, trade_run: TradeRun) -> None:
        """Delete a trade run."""
        await self.db.delete(trade_run)
        await self.db.commit()

    async def get_user_trade_stats(self, user_id: int) -> dict:
        """Get trading statistics for a user."""
        # Total profit
        result = await self.db.execute(
            select(func.sum(TradeRun.profit))
            .where(TradeRun.user_id == user_id)
        )
        total_profit = result.scalar() or 0

        # Total runs
        result = await self.db.execute(
            select(func.count(TradeRun.id))
            .where(TradeRun.user_id == user_id)
        )
        total_runs = result.scalar() or 0

        # Average profit per run
        avg_profit = total_profit / total_runs if total_runs > 0 else 0

        # Best commodity
        result = await self.db.execute(
            select(
                TradeRun.commodity,
                func.sum(TradeRun.profit).label("total_profit")
            )
            .where(TradeRun.user_id == user_id)
            .group_by(TradeRun.commodity)
            .order_by(desc("total_profit"))
            .limit(1)
        )
        best_commodity = result.first()

        return {
            "total_profit": total_profit,
            "total_runs": total_runs,
            "avg_profit_per_run": avg_profit,
            "best_commodity": best_commodity[0] if best_commodity else None,
            "best_commodity_profit": best_commodity[1] if best_commodity else 0,
        }



    # === Price Report Methods ===

    async def create_price_report(
        self,
        user_id: int,
        data: PriceReportCreate,
    ) -> PriceReport:
        """Create a new price report and track activity."""
        price_report = PriceReport(
            user_id=user_id,
            location=data.location,
            commodity=data.commodity,
            buy_price=data.buy_price,
            sell_price=data.sell_price,
            reported_at=datetime.utcnow(),
        )
        self.db.add(price_report)
        await self.db.commit()
        await self.db.refresh(price_report)
        
        # Track activity
        from app.services.activity import ActivityService
        activity_service = ActivityService(self.db)
        await activity_service.track_price_reported(
            user_id=user_id,
            report_id=price_report.id,
            location=price_report.location,
            commodity=price_report.commodity
        )
        
        return price_report

    async def get_price_reports(
        self,
        location: Optional[str] = None,
        commodity: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[PriceReport]:
        """Get price reports with optional filtering."""
        query = select(PriceReport).order_by(desc(PriceReport.reported_at))
        
        if location:
            query = query.where(PriceReport.location == location)
        if commodity:
            query = query.where(PriceReport.commodity == commodity)
        
        result = await self.db.execute(
            query.offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_latest_prices_by_location(self, location: str) -> List[dict]:
        """Get latest prices for all commodities at a location."""
        # Subquery to get the latest report for each commodity at this location
        subq = (
            select(
                PriceReport.commodity,
                func.max(PriceReport.reported_at).label("latest_reported")
            )
            .where(PriceReport.location == location)
            .group_by(PriceReport.commodity)
            .subquery()
        )
        
        result = await self.db.execute(
            select(PriceReport)
            .join(
                subq,
                and_(
                    PriceReport.commodity == subq.c.commodity,
                    PriceReport.reported_at == subq.c.latest_reported
                )
            )
            .where(PriceReport.location == location)
            .order_by(PriceReport.commodity)
        )
        
        return list(result.scalars().all())

    async def get_price_history(
        self,
        location: str,
        commodity: str,
        days: int = 7,
    ) -> List[PriceReport]:
        """Get price history for a commodity at a location."""
        from_date = datetime.utcnow() - timedelta(days=days)
        
        result = await self.db.execute(
            select(PriceReport)
            .where(
                and_(
                    PriceReport.location == location,
                    PriceReport.commodity == commodity,
                    PriceReport.reported_at >= from_date
                )
            )
            .order_by(PriceReport.reported_at)
        )
        return list(result.scalars().all())

    async def get_best_routes(self, limit: int = 10) -> List[dict]:
        """Find best trade routes based on price differences."""
        # Get all price reports
        result = await self.db.execute(
            select(PriceReport)
            .order_by(PriceReport.commodity, PriceReport.location)
        )
        reports = result.scalars().all()
        
        # Group by commodity and calculate best buy/sell pairs
        commodity_prices = {}
        for report in reports:
            if report.commodity not in commodity_prices:
                commodity_prices[report.commodity] = []
            commodity_prices[report.commodity].append(report)
        
        routes = []
        for commodity, prices in commodity_prices.items():
            # Find lowest buy price and highest sell price
            buy_prices = [p for p in prices if p.buy_price]
            sell_prices = [p for p in prices if p.sell_price]
            
            if buy_prices and sell_prices:
                best_buy = min(buy_prices, key=lambda p: p.buy_price)
                best_sell = max(sell_prices, key=lambda p: p.sell_price)
                
                if best_sell.sell_price > best_buy.buy_price:
                    profit = best_sell.sell_price - best_buy.buy_price
                    routes.append({
                        "commodity": commodity,
                        "origin": best_buy.location,
                        "destination": best_sell.location,
                        "buy_price": best_buy.buy_price,
                        "sell_price": best_sell.sell_price,
                        "profit_per_unit": profit,
                        "profit_margin_percent": (profit / best_buy.buy_price) * 100,
                    })
        
        # Sort by profit margin
        routes.sort(key=lambda r: r["profit_per_unit"], reverse=True)
        return routes[:limit]

    # === Cargo Contract Methods ===

    async def create_cargo_contract(
        self,
        poster_id: int,
        data: CargoContractCreate,
    ) -> CargoContract:
        """Create a new cargo contract and deduct payment from poster's wallet (escrow)."""
        from app.services.wallet import WalletService
        from app.services.activity import ActivityService
        
        wallet_service = WalletService(self.db)
        activity_service = ActivityService(self.db)
        
        poster_wallet = await wallet_service.get_or_create_wallet(poster_id)
        if poster_wallet.balance_auec < data.payment_amount:
            raise ValueError("Insufficient funds in wallet for this contract")
            
        # Deduct payment for escrow
        await wallet_service.withdraw(
            poster_wallet, 
            data.payment_amount, 
            transaction_type="contract_escrow",
            description=f"Escrow for cargo contract: {data.origin} to {data.destination}"
        )

        contract = CargoContract(
            poster_id=poster_id,
            origin_location=data.origin,
            destination_location=data.destination,
            commodity=data.commodity,
            quantity=data.quantity,
            payment_amount=data.payment_amount,
            deadline=data.deadline,
            status=ContractStatus.OPEN,
        )
        self.db.add(contract)
        await self.db.commit()
        await self.db.refresh(contract)
        
        # Track activity
        await activity_service.track_contract_posted(
            user_id=poster_id,
            contract_id=contract.id,
            origin=contract.origin_location,
            destination=contract.destination_location
        )
        
        return contract

    async def get_contract_by_id(self, contract_id: int) -> Optional[CargoContract]:
        result = await self.db.execute(
            select(CargoContract).where(CargoContract.id == contract_id)
        )
        return result.scalar_one_or_none()

    async def get_open_contracts(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> List[CargoContract]:
        """Get all open cargo contracts."""
        result = await self.db.execute(
            select(CargoContract)
            .where(CargoContract.status == ContractStatus.OPEN)
            .order_by(desc(CargoContract.created_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_posted_contracts(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[CargoContract]:
        """Get contracts posted by a user."""
        result = await self.db.execute(
            select(CargoContract)
            .where(CargoContract.poster_id == user_id)
            .order_by(desc(CargoContract.created_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_accepted_contracts(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[CargoContract]:
        """Get contracts accepted by a user (hauler)."""
        result = await self.db.execute(
            select(CargoContract)
            .where(CargoContract.hauler_id == user_id)
            .order_by(desc(CargoContract.created_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def accept_contract(
        self,
        contract: CargoContract,
        hauler_id: int,
    ) -> CargoContract:
        """Accept a cargo contract."""
        if contract.status != ContractStatus.OPEN:
            raise ValueError("Contract is not open for acceptance")
        
        if contract.poster_id == hauler_id:
            raise ValueError("Cannot accept your own contract")
        
        contract.hauler_id = hauler_id
        contract.status = ContractStatus.ACCEPTED
        
        await self.db.commit()
        await self.db.refresh(contract)
        return contract

    async def start_contract(self, contract: CargoContract) -> CargoContract:
        """Mark a contract as in progress."""
        if contract.status != ContractStatus.ACCEPTED:
            raise ValueError("Contract must be accepted first")
        
        contract.status = ContractStatus.IN_PROGRESS
        await self.db.commit()
        await self.db.refresh(contract)
        return contract

    async def complete_contract(self, contract: CargoContract) -> CargoContract:
        """Complete a cargo contract and release payment from escrow to hauler."""
        if contract.status != ContractStatus.IN_PROGRESS:
            raise ValueError("Contract must be in progress to complete")
        
        from app.services.wallet import WalletService
        from app.services.activity import ActivityService
        
        wallet_service = WalletService(self.db)
        activity_service = ActivityService(self.db)
        
        hauler_wallet = await wallet_service.get_or_create_wallet(contract.hauler_id)
        
        # Release payment
        await wallet_service.deposit(
            hauler_wallet,
            contract.payment_amount,
            transaction_type="contract_payment",
            description=f"Payment for cargo contract #{contract.id}"
        )

        contract.status = ContractStatus.COMPLETED
        contract.completed_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(contract)
        
        # Track activity
        await activity_service.track_contract_completed(
            hauler_id=contract.hauler_id,
            contract_id=contract.id,
            origin=contract.origin_location,
            destination=contract.destination_location,
            payment=contract.payment_amount
        )
        
        return contract

    async def cancel_contract(
        self,
        contract: CargoContract,
        cancelled_by_id: int,
    ) -> CargoContract:
        """Cancel a cargo contract and refund poster if needed."""
        if contract.status in [ContractStatus.COMPLETED, ContractStatus.CANCELLED]:
            raise ValueError("Contract is already completed or cancelled")
        
        # Only poster or hauler can cancel
        if contract.poster_id != cancelled_by_id and contract.hauler_id != cancelled_by_id:
            raise ValueError("Only poster or hauler can cancel this contract")
        
        from app.services.wallet import WalletService
        wallet_service = WalletService(self.db)
        
        # Refund poster
        poster_wallet = await wallet_service.get_or_create_wallet(contract.poster_id)
        await wallet_service.deposit(
            poster_wallet,
            contract.payment_amount,
            transaction_type="contract_refund",
            description=f"Refund for cancelled cargo contract #{contract.id}"
        )

        contract.status = ContractStatus.CANCELLED
        await self.db.commit()
        await self.db.refresh(contract)
        return contract

    async def dispute_contract(self, contract: CargoContract) -> CargoContract:
        """Mark a contract as disputed for admin review."""
        if contract.status not in [ContractStatus.ACCEPTED, ContractStatus.IN_PROGRESS]:
            raise ValueError("Can only dispute accepted or in-progress contracts")
        
        contract.status = ContractStatus.DISPUTED
        await self.db.commit()
        await self.db.refresh(contract)
        return contract

    async def get_hauler_stats(self, hauler_id: int) -> dict:
        """Get statistics for a hauler."""
        # Completed contracts
        result = await self.db.execute(
            select(func.count(CargoContract.id))
            .where(
                and_(
                    CargoContract.hauler_id == hauler_id,
                    CargoContract.status == ContractStatus.COMPLETED
                )
            )
        )
        completed = result.scalar() or 0

        # Total earnings
        result = await self.db.execute(
            select(func.sum(CargoContract.payment_amount))
            .where(
                and_(
                    CargoContract.hauler_id == hauler_id,
                    CargoContract.status == ContractStatus.COMPLETED
                )
            )
        )
        total_earnings = result.scalar() or 0

        # Total volume hauled
        result = await self.db.execute(
            select(func.sum(CargoContract.quantity))
            .where(
                and_(
                    CargoContract.hauler_id == hauler_id,
                    CargoContract.status == ContractStatus.COMPLETED
                )
            )
        )
        total_volume = result.scalar() or 0

        return {
            "contracts_completed": completed,
            "total_earnings": total_earnings,
            "total_volume_hauled": total_volume,
            "reputation_score": completed * 10,  # Simple reputation formula
        }
