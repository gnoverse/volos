// Package processor provides concurrent transaction processing utilities for the backend.
//
// This file contains the core transaction processor that handles all transactions
// from the gno.land/r/volos/core package, including market operations, lending,
// borrowing, and other core protocol functionality.
package processor

import (
	"log/slog"
	"volos-backend/services/dbupdater"

	"cloud.google.com/go/firestore"
	"github.com/gnolang/gno/gno.land/pkg/gnoclient"

)

// processCoreTransaction handles transactions from the core package, processing various
// event types such as CreateMarket, Supply, Withdraw, Borrow, Repay, Liquidate,
// AccrueInterest, SupplyCollateral, WithdrawCollateral.
func processCoreTransaction(tx map[string]interface{}, firestoreClient *firestore.Client, gnoClient *gnoclient.Client) {
	events := extractEventsFromTx(tx)
	if events == nil {
		return
	}

	txMetadata := extractTxMetadata(tx)

	for _, eventInterface := range events {
		event, eventType := getEventAndType(eventInterface)
		if event == nil || eventType == "" {
			continue
		}

		switch eventType {
		case "CreateMarket":
			if createEvent, ok := extractCreateMarketFields(event); ok {
				dbupdater.CreateMarket(firestoreClient,
					gnoClient,
					createEvent.MarketID,
					createEvent.LoanToken,
					createEvent.CollateralToken,
					createEvent.LoanTokenName,
					createEvent.LoanTokenSymbol,
					createEvent.LoanTokenDecimals,
					createEvent.CollateralTokenName,
					createEvent.CollateralTokenSymbol,
					createEvent.CollateralTokenDecimals,
					createEvent.Timestamp,
					createEvent.LLTV,
				)
			}

		case "Supply":
			if supplyEvent, ok := extractSupplyFields(event); ok {
				dbupdater.UpdateTotalSupply(firestoreClient, supplyEvent.MarketID, supplyEvent.Amount, supplyEvent.Shares, supplyEvent.Timestamp, txMetadata.Caller, txMetadata.Hash, eventType, txMetadata.Index, txMetadata.BlockHeight)
				dbupdater.UpdateAPRHistory(firestoreClient, supplyEvent.MarketID, supplyEvent.SupplyAPR, supplyEvent.BorrowAPR, supplyEvent.Timestamp, txMetadata.Index, txMetadata.BlockHeight)
				dbupdater.UpdateUtilizationHistory(firestoreClient, supplyEvent.MarketID, supplyEvent.Timestamp, supplyEvent.Utilization, txMetadata.Index, txMetadata.BlockHeight)
				dbupdater.UpdateUserMarketSupply(firestoreClient, supplyEvent.OnBehalf, supplyEvent.MarketID, supplyEvent.Amount, supplyEvent.Shares, eventType)
			}

		case "Withdraw":
			if withdrawEvent, ok := extractWithdrawFields(event); ok {
				dbupdater.UpdateTotalSupply(firestoreClient, withdrawEvent.MarketID, withdrawEvent.Amount, withdrawEvent.Shares, withdrawEvent.Timestamp, txMetadata.Caller, txMetadata.Hash, eventType, txMetadata.Index, txMetadata.BlockHeight)
				dbupdater.UpdateAPRHistory(firestoreClient, withdrawEvent.MarketID, withdrawEvent.SupplyAPR, withdrawEvent.BorrowAPR, withdrawEvent.Timestamp, txMetadata.Index, txMetadata.BlockHeight)
				dbupdater.UpdateUtilizationHistory(firestoreClient, withdrawEvent.MarketID, withdrawEvent.Timestamp, withdrawEvent.Utilization, txMetadata.Index, txMetadata.BlockHeight)
				dbupdater.UpdateUserMarketSupply(firestoreClient, withdrawEvent.OnBehalf, withdrawEvent.MarketID, withdrawEvent.Amount, withdrawEvent.Shares, eventType)
			}

		case "Borrow":
			if borrowEvent, ok := extractBorrowFields(event); ok {
				dbupdater.UpdateTotalBorrow(firestoreClient, borrowEvent.MarketID, borrowEvent.Amount, borrowEvent.Shares, borrowEvent.Timestamp, txMetadata.Caller, txMetadata.Hash, eventType, txMetadata.Index, txMetadata.BlockHeight)
				dbupdater.UpdateAPRHistory(firestoreClient, borrowEvent.MarketID, borrowEvent.SupplyAPR, borrowEvent.BorrowAPR, borrowEvent.Timestamp, txMetadata.Index, txMetadata.BlockHeight)
				dbupdater.UpdateUtilizationHistory(firestoreClient, borrowEvent.MarketID, borrowEvent.Timestamp, borrowEvent.Utilization, txMetadata.Index, txMetadata.BlockHeight)
				dbupdater.UpdateUserMarketLoan(firestoreClient, borrowEvent.OnBehalf, borrowEvent.MarketID, borrowEvent.Amount, borrowEvent.Shares, eventType)
			}

		case "Repay":
			if repayEvent, ok := extractRepayFields(event); ok {
				dbupdater.UpdateTotalBorrow(firestoreClient, repayEvent.MarketID, repayEvent.Amount, repayEvent.Shares, repayEvent.Timestamp, txMetadata.Caller, txMetadata.Hash, eventType, txMetadata.Index, txMetadata.BlockHeight)
				dbupdater.UpdateAPRHistory(firestoreClient, repayEvent.MarketID, repayEvent.SupplyAPR, repayEvent.BorrowAPR, repayEvent.Timestamp, txMetadata.Index, txMetadata.BlockHeight)
				dbupdater.UpdateUtilizationHistory(firestoreClient, repayEvent.MarketID, repayEvent.Timestamp, repayEvent.Utilization, txMetadata.Index, txMetadata.BlockHeight)
				dbupdater.UpdateUserMarketLoan(firestoreClient, repayEvent.OnBehalf, repayEvent.MarketID, repayEvent.Amount, repayEvent.Shares, eventType)
			}

		case "Liquidate":
			if liquidateEvent, ok := extractLiquidateFields(event); ok {
				dbupdater.UpdateTotalBorrow(firestoreClient, liquidateEvent.MarketID, liquidateEvent.Amount, liquidateEvent.Shares, liquidateEvent.Timestamp, txMetadata.Caller, txMetadata.Hash, eventType, txMetadata.Index, txMetadata.BlockHeight)
				// TODO: If borrower collateral becomes zero, also decrease total_supply and any additional bad-debt borrow reduction.
				//       Requires extra event data (e.g., bad_debt_assets) or a state read/reconciliation pass.
				dbupdater.UpdateAPRHistory(firestoreClient, liquidateEvent.MarketID, liquidateEvent.SupplyAPR, liquidateEvent.BorrowAPR, liquidateEvent.Timestamp, txMetadata.Index, txMetadata.BlockHeight)
				dbupdater.UpdateUtilizationHistory(firestoreClient, liquidateEvent.MarketID, liquidateEvent.Timestamp, liquidateEvent.Utilization, txMetadata.Index, txMetadata.BlockHeight)
				dbupdater.UpdateUserMarketLoan(firestoreClient, liquidateEvent.Borrower, liquidateEvent.MarketID, liquidateEvent.Amount, liquidateEvent.Shares, eventType)
			}

		case "SupplyCollateral":
			if scEvent, ok := extractSupplyCollateralFields(event); ok {
				dbupdater.UpdateTotalCollateralSupply(firestoreClient, scEvent.MarketID, scEvent.Amount, scEvent.Timestamp, txMetadata.Caller, txMetadata.Hash, eventType, txMetadata.Index, txMetadata.BlockHeight)
				dbupdater.UpdateUserMarketCollateralSupply(firestoreClient, scEvent.OnBehalf, scEvent.MarketID, scEvent.Amount, eventType)
			}

		case "WithdrawCollateral":
			if wcEvent, ok := extractWithdrawCollateralFields(event); ok {
				dbupdater.UpdateTotalCollateralSupply(firestoreClient, wcEvent.MarketID, wcEvent.Amount, wcEvent.Timestamp, txMetadata.Caller, txMetadata.Hash, eventType, txMetadata.Index, txMetadata.BlockHeight)
				dbupdater.UpdateUserMarketCollateralSupply(firestoreClient, wcEvent.OnBehalf, wcEvent.MarketID, wcEvent.Amount, eventType)
			}
		
		case "AccrueInterest":
			// if accrueEvent, ok := extractAccrueInterestFields(event); ok {
			// 	dbupdater.UpdateUtilizationHistory(firestoreClient, accrueEvent.MarketID, accrueEvent.Timestamp, accrueEvent.Utilization)
			// }

		case "StorageDeposit":
			continue
		}
	}
}

func extractCreateMarketFields(event map[string]interface{}) (*CreateMarketEvent, bool) {
	requiredFields := []string{
		"market_id",
		"loan_token",
		"collateral_token",
		"loanTokenName",
		"loanTokenSymbol",
		"loanTokenDecimals",
		"collateralTokenName",
		"collateralTokenSymbol",
		"collateralTokenDecimals",
		"currentTimestamp",
		"lltv",
	}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		slog.Error("failed to extract create market fields", "event", event)
		return nil, false
	}

	return &CreateMarketEvent{
		MarketID:                fields["market_id"],
		LoanToken:               fields["loan_token"],
		CollateralToken:         fields["collateral_token"],
		LoanTokenName:           fields["loanTokenName"],
		LoanTokenSymbol:         fields["loanTokenSymbol"],
		LoanTokenDecimals:       fields["loanTokenDecimals"],
		CollateralTokenName:     fields["collateralTokenName"],
		CollateralTokenSymbol:   fields["collateralTokenSymbol"],
		CollateralTokenDecimals: fields["collateralTokenDecimals"],
		Timestamp:               fields["currentTimestamp"],
		LLTV:                    fields["lltv"],
	}, true
}

func extractSupplyFields(event map[string]interface{}) (*SupplyEvent, bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR", "utilization"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		slog.Error("failed to extract supply fields", "event", event)
		return nil, false
	}

	return &SupplyEvent{
		MarketID:  fields["market_id"],
		User:      fields["user"],
		OnBehalf:  fields["on_behalf"],
		Amount:    fields["amount"],
		Shares:    fields["shares"],
		Timestamp: fields["currentTimestamp"],
		SupplyAPR: fields["supplyAPR"],
		BorrowAPR: fields["borrowAPR"],
		Utilization: fields["utilization"],
	}, true
}

func extractWithdrawFields(event map[string]interface{}) (*WithdrawEvent, bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "receiver", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR", "utilization"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		slog.Error("failed to extract withdraw fields", "event", event)
		return nil, false
	}

	return &WithdrawEvent{
		MarketID:  fields["market_id"],
		User:      fields["user"],
		OnBehalf:  fields["on_behalf"],
		Receiver:  fields["receiver"],
		Amount:    fields["amount"],
		Shares:    fields["shares"],
		Timestamp: fields["currentTimestamp"],
		SupplyAPR: fields["supplyAPR"],
		BorrowAPR: fields["borrowAPR"],
		Utilization: fields["utilization"],
	}, true
}

func extractBorrowFields(event map[string]interface{}) (*BorrowEvent, bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "receiver", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR", "utilization"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		slog.Error("failed to extract borrow fields", "event", event)
		return nil, false
	}

	return &BorrowEvent{
		MarketID:  fields["market_id"],
		User:      fields["user"],
		OnBehalf:  fields["on_behalf"],
		Receiver:  fields["receiver"],
		Amount:    fields["amount"],
		Shares:    fields["shares"],
		Timestamp: fields["currentTimestamp"],
		SupplyAPR: fields["supplyAPR"],
		BorrowAPR: fields["borrowAPR"],
		Utilization: fields["utilization"],
	}, true
}

func extractRepayFields(event map[string]interface{}) (*RepayEvent, bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR", "utilization"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		slog.Error("failed to extract repay fields", "event", event)
		return nil, false
	}

	return &RepayEvent{
		MarketID:  fields["market_id"],
		User:      fields["user"],
		OnBehalf:  fields["on_behalf"],
		Amount:    fields["amount"],
		Shares:    fields["shares"],
		Timestamp: fields["currentTimestamp"],
		SupplyAPR: fields["supplyAPR"],
		BorrowAPR: fields["borrowAPR"],
		Utilization: fields["utilization"],
	}, true
}

func extractLiquidateFields(event map[string]interface{}) (*LiquidateEvent, bool) {
	requiredFields := []string{"market_id", "user", "borrower", "amount", "shares", "seized", "currentTimestamp", "supplyAPR", "borrowAPR", "utilization"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		slog.Error("failed to extract liquidate fields", "event", event)
		return nil, false
	}

	return &LiquidateEvent{
		MarketID:  fields["market_id"],
		User:      fields["user"],
		Borrower:  fields["borrower"],
		Amount:    fields["amount"],
		Shares:    fields["shares"],
		Seized:    fields["seized"],
		Timestamp: fields["currentTimestamp"],
		SupplyAPR: fields["supplyAPR"],
		BorrowAPR: fields["borrowAPR"],
		Utilization: fields["utilization"],
	}, true
}

func extractSupplyCollateralFields(event map[string]interface{}) (*SupplyCollateralEvent, bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "amount", "currentTimestamp"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		slog.Error("failed to extract supply collateral fields", "event", event)
		return nil, false
	}
	return &SupplyCollateralEvent{
		MarketID:  fields["market_id"],
		User:      fields["user"],
		OnBehalf:  fields["on_behalf"],
		Amount:    fields["amount"],
		Timestamp: fields["currentTimestamp"],
	}, true
}

func extractWithdrawCollateralFields(event map[string]interface{}) (*WithdrawCollateralEvent, bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "receiver", "amount", "currentTimestamp"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		slog.Error("failed to extract withdraw collateral fields", "event", event)
		return nil, false
	}
	return &WithdrawCollateralEvent{
		MarketID:  fields["market_id"],
		User:      fields["user"],
		OnBehalf:  fields["on_behalf"],
		Receiver:  fields["receiver"],
		Amount:    fields["amount"],
		Timestamp: fields["currentTimestamp"],
	}, true
}


func extractAccrueInterestFields(event map[string]interface{}) (*AccrueInterestEvent, bool) {
	requiredFields := []string{"market_id", "currentTimestamp", "utilization"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		slog.Error("failed to extract accrue interest fields", "event", event)
		return nil, false
	}
	return &AccrueInterestEvent{
		MarketID:  fields["market_id"],
		Timestamp: fields["currentTimestamp"],
		Utilization: fields["utilization"],
	}, true
}
