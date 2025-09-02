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
				dbupdater.CreateMarket(client,
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
				dbupdater.UpdateTotalSupply(client, supplyEvent.MarketID, supplyEvent.Amount, supplyEvent.Timestamp, caller, txHash, eventType)
				dbupdater.UpdateAPRHistory(client, supplyEvent.MarketID, supplyEvent.SupplyAPR, supplyEvent.BorrowAPR, supplyEvent.Timestamp)
				dbupdater.UpdateUtilizationHistory(client, supplyEvent.MarketID, supplyEvent.Timestamp)
				dbupdater.UpdateUserMarketSupply(client, supplyEvent.OnBehalf, supplyEvent.MarketID, supplyEvent.Amount, eventType)
			}

		case "Withdraw":
			if withdrawEvent, ok := extractWithdrawFields(event); ok {
				dbupdater.UpdateTotalSupply(client, withdrawEvent.MarketID, withdrawEvent.Amount, withdrawEvent.Timestamp, caller, txHash, eventType)
				dbupdater.UpdateAPRHistory(client, withdrawEvent.MarketID, withdrawEvent.SupplyAPR, withdrawEvent.BorrowAPR, withdrawEvent.Timestamp)
				dbupdater.UpdateUtilizationHistory(client, withdrawEvent.MarketID, withdrawEvent.Timestamp)
				dbupdater.UpdateUserMarketSupply(client, withdrawEvent.OnBehalf, withdrawEvent.MarketID, withdrawEvent.Amount, eventType)
			}

		case "Borrow":
			if borrowEvent, ok := extractBorrowFields(event); ok {
				dbupdater.UpdateTotalBorrow(client, borrowEvent.MarketID, borrowEvent.Amount, borrowEvent.Timestamp, caller, txHash, eventType)
				dbupdater.UpdateAPRHistory(client, borrowEvent.MarketID, borrowEvent.SupplyAPR, borrowEvent.BorrowAPR, borrowEvent.Timestamp)
				dbupdater.UpdateUtilizationHistory(client, borrowEvent.MarketID, borrowEvent.Timestamp)
				dbupdater.UpdateUserMarketLoan(client, borrowEvent.OnBehalf, borrowEvent.MarketID, borrowEvent.Amount, eventType)
			}

		case "Repay":
			if repayEvent, ok := extractRepayFields(event); ok {
				dbupdater.UpdateTotalBorrow(client, repayEvent.MarketID, repayEvent.Amount, repayEvent.Timestamp, caller, txHash, eventType)
				dbupdater.UpdateAPRHistory(client, repayEvent.MarketID, repayEvent.SupplyAPR, repayEvent.BorrowAPR, repayEvent.Timestamp)
				dbupdater.UpdateUtilizationHistory(client, repayEvent.MarketID, repayEvent.Timestamp)
				dbupdater.UpdateUserMarketLoan(client, repayEvent.OnBehalf, repayEvent.MarketID, repayEvent.Amount, eventType)
			}

		case "Liquidate":
			if liquidateEvent, ok := extractLiquidateFields(event); ok {
				dbupdater.UpdateTotalBorrow(client, liquidateEvent.MarketID, liquidateEvent.Amount, liquidateEvent.Timestamp, caller, txHash, eventType)
				// TODO: If borrower collateral becomes zero, also decrease total_supply and any additional bad-debt borrow reduction.
				//       Requires extra event data (e.g., bad_debt_assets) or a state read/reconciliation pass.
				dbupdater.UpdateAPRHistory(client, liquidateEvent.MarketID, liquidateEvent.SupplyAPR, liquidateEvent.BorrowAPR, liquidateEvent.Timestamp)
				dbupdater.UpdateUtilizationHistory(client, liquidateEvent.MarketID, liquidateEvent.Timestamp)
				dbupdater.UpdateUserMarketLoan(client, liquidateEvent.Borrower, liquidateEvent.MarketID, liquidateEvent.Amount, eventType)
			}

		case "SupplyCollateral":
			if scEvent, ok := extractSupplyCollateralFields(event); ok {
				dbupdater.UpdateTotalCollateralSupply(client, scEvent.MarketID, scEvent.Amount, scEvent.Timestamp, caller, txHash, eventType)
				dbupdater.UpdateUserMarketCollateralSupply(client, scEvent.OnBehalf, scEvent.MarketID, scEvent.Amount, eventType)
			}

		case "WithdrawCollateral":
			if wcEvent, ok := extractWithdrawCollateralFields(event); ok {
				dbupdater.UpdateTotalCollateralSupply(client, wcEvent.MarketID, wcEvent.Amount, wcEvent.Timestamp, caller, txHash, eventType)
				dbupdater.UpdateUserMarketCollateralSupply(client, wcEvent.OnBehalf, wcEvent.MarketID, wcEvent.Amount, eventType)
			}

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
	requiredFields := []string{"market_id", "user", "on_behalf", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR"}
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
	}, true
}

func extractWithdrawFields(event map[string]interface{}) (*WithdrawEvent, bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "receiver", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR"}
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
	}, true
}

func extractBorrowFields(event map[string]interface{}) (*BorrowEvent, bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "receiver", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR"}
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
	}, true
}

func extractRepayFields(event map[string]interface{}) (*RepayEvent, bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR"}
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
	}, true
}

func extractLiquidateFields(event map[string]interface{}) (*LiquidateEvent, bool) {
	requiredFields := []string{"market_id", "user", "borrower", "amount", "shares", "seized", "currentTimestamp", "supplyAPR", "borrowAPR"}
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
