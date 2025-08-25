// Package processor provides concurrent transaction processing utilities for the backend.
//
// This file contains the core transaction processor that handles all transactions
// from the gno.land/r/volos/core package, including market operations, lending,
// borrowing, and other core protocol functionality.
package processor

import (
	"volos-backend/services/dbupdater"

	"cloud.google.com/go/firestore"
)

// processCoreTransaction handles transactions from the core package, processing various
// event types such as CreateMarket, Supply, Withdraw, Borrow, Repay, Liquidate,
// AccrueInterest, SupplyCollateral, WithdrawCollateral.
func processCoreTransaction(tx map[string]interface{}, client *firestore.Client) {
	events := extractEventsFromTx(tx)
	if events == nil {
		return
	}

	caller, txHash := extractCallerAndHash(tx)

	for _, eventInterface := range events {
		event, eventType := getEventAndType(eventInterface)
		if event == nil || eventType == "" {
			continue
		}

		switch eventType {
		case "CreateMarket":
			if createEvent, ok := extractCreateMarketFields(event); ok {
				dbupdater.CreateMarket(client, createEvent.MarketID, createEvent.LoanToken, createEvent.CollateralToken, createEvent.Timestamp)
			}

		case "Supply":
			if supplyEvent, ok := extractSupplyFields(event); ok {
				dbupdater.UpdateTotalSupply(client, supplyEvent.MarketID, supplyEvent.Amount, supplyEvent.Timestamp, true, caller, txHash)
				dbupdater.UpdateAPRHistory(client, supplyEvent.MarketID, supplyEvent.SupplyAPR, supplyEvent.BorrowAPR, supplyEvent.Timestamp)
				dbupdater.UpdateUtilizationHistory(client, supplyEvent.MarketID, supplyEvent.Timestamp)
			}
		case "Withdraw":
			if withdrawEvent, ok := extractWithdrawFields(event); ok {
				dbupdater.UpdateTotalSupply(client, withdrawEvent.MarketID, withdrawEvent.Amount, withdrawEvent.Timestamp, false, caller, txHash)
				dbupdater.UpdateAPRHistory(client, withdrawEvent.MarketID, withdrawEvent.SupplyAPR, withdrawEvent.BorrowAPR, withdrawEvent.Timestamp)
				dbupdater.UpdateUtilizationHistory(client, withdrawEvent.MarketID, withdrawEvent.Timestamp)
			}
		case "Borrow":
			if borrowEvent, ok := extractBorrowFields(event); ok {
				dbupdater.UpdateTotalBorrow(client, borrowEvent.MarketID, borrowEvent.Amount, borrowEvent.Timestamp, true, caller, txHash)
				dbupdater.UpdateAPRHistory(client, borrowEvent.MarketID, borrowEvent.SupplyAPR, borrowEvent.BorrowAPR, borrowEvent.Timestamp)
				dbupdater.UpdateUtilizationHistory(client, borrowEvent.MarketID, borrowEvent.Timestamp)
			}
		case "Repay":
			if repayEvent, ok := extractRepayFields(event); ok {
				dbupdater.UpdateTotalBorrow(client, repayEvent.MarketID, repayEvent.Amount, repayEvent.Timestamp, false, caller, txHash)
				dbupdater.UpdateAPRHistory(client, repayEvent.MarketID, repayEvent.SupplyAPR, repayEvent.BorrowAPR, repayEvent.Timestamp)
				dbupdater.UpdateUtilizationHistory(client, repayEvent.MarketID, repayEvent.Timestamp)
			}
		case "Liquidate":
			if liquidateEvent, ok := extractLiquidateFields(event); ok {
				dbupdater.UpdateTotalBorrow(client, liquidateEvent.MarketID, liquidateEvent.Amount, liquidateEvent.Timestamp, false, caller, txHash)
				// TODO: If borrower collateral becomes zero, also decrease total_supply and any additional bad-debt borrow reduction.
				//       Requires extra event data (e.g., bad_debt_assets) or a state read/reconciliation pass.
				dbupdater.UpdateAPRHistory(client, liquidateEvent.MarketID, liquidateEvent.SupplyAPR, liquidateEvent.BorrowAPR, liquidateEvent.Timestamp)
				dbupdater.UpdateUtilizationHistory(client, liquidateEvent.MarketID, liquidateEvent.Timestamp)
			}
		case "AccrueInterest":
			dbupdater.ProcessAccrueInterest(tx)
		case "SupplyCollateral":
			if scEvent, ok := extractSupplyCollateralFields(event); ok {
				dbupdater.UpdateTotalCollateralSupply(client, scEvent.MarketID, scEvent.Amount, scEvent.Timestamp, true, caller, txHash)
			}
		case "WithdrawCollateral":
			if wcEvent, ok := extractWithdrawCollateralFields(event); ok {
				dbupdater.UpdateTotalCollateralSupply(client, wcEvent.MarketID, wcEvent.Amount, wcEvent.Timestamp, false, caller, txHash)
			}
		case "StorageDeposit":
			continue
		}
	}
}
