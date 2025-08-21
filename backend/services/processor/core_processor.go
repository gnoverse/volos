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
// RegisterIRM, AccrueInterest, SupplyCollateral, WithdrawCollateral, and authorization_set.
func processCoreTransaction(tx map[string]interface{}, client *firestore.Client) {
	response, ok := tx["response"].(map[string]interface{})
	if !ok {
		slog.Error("transaction missing 'response' field", "transaction", tx)
		return
	}
	events, ok := response["events"].([]interface{})
	if !ok || len(events) == 0 {
		slog.Error("transaction missing or empty 'events' array", "response", response)
		return
	}

	for _, eventInterface := range events {
		event, ok := eventInterface.(map[string]interface{})
		if !ok {
			slog.Error("event is not a map", "event_interface", eventInterface)
			continue
		}

		eventType, ok := event["type"].(string)
		if !ok {
			slog.Error("event type is not a string", "event", event)
			continue
		}

		switch eventType {
		case "CreateMarket":
			createEvent, ok := extractCreateMarketFields(event)
			if ok {
				dbupdater.CreateMarket(client, createEvent.MarketID, createEvent.LoanToken, createEvent.CollateralToken, createEvent.Timestamp)
			}

		case "Supply":
			supplyEvent, ok := extractSupplyFields(event)
			if ok {
				dbupdater.UpdateTotalSupply(client, supplyEvent.MarketID, supplyEvent.Amount, supplyEvent.Timestamp, true)
				dbupdater.UpdateAPRHistory(client, supplyEvent.MarketID, supplyEvent.SupplyAPR, supplyEvent.BorrowAPR, supplyEvent.Timestamp)
			}
		case "Withdraw":
			withdrawEvent, ok := extractWithdrawFields(event)
			if ok {
				dbupdater.UpdateTotalSupply(client, withdrawEvent.MarketID, withdrawEvent.Amount, withdrawEvent.Timestamp, false)
				dbupdater.UpdateAPRHistory(client, withdrawEvent.MarketID, withdrawEvent.SupplyAPR, withdrawEvent.BorrowAPR, withdrawEvent.Timestamp)
			}
		case "Borrow":
			borrowEvent, ok := extractBorrowFields(event)
			if ok {
				dbupdater.UpdateTotalBorrow(client, borrowEvent.MarketID, borrowEvent.Amount, borrowEvent.Timestamp, true)
				dbupdater.UpdateAPRHistory(client, borrowEvent.MarketID, borrowEvent.SupplyAPR, borrowEvent.BorrowAPR, borrowEvent.Timestamp)
			}
		case "Repay":
			repayEvent, ok := extractRepayFields(event)
			if ok {
				dbupdater.UpdateTotalBorrow(client, repayEvent.MarketID, repayEvent.Amount, repayEvent.Timestamp, false)
				dbupdater.UpdateAPRHistory(client, repayEvent.MarketID, repayEvent.SupplyAPR, repayEvent.BorrowAPR, repayEvent.Timestamp)
			}
		case "Liquidate":
			liquidateEvent, ok := extractLiquidateFields(event)
			if ok {
				dbupdater.UpdateTotalBorrow(client, liquidateEvent.MarketID, liquidateEvent.Amount, liquidateEvent.Timestamp, false)
				// TODO: If borrower collateral becomes zero, also decrease total_supply and any additional bad-debt borrow reduction.
				//       Requires extra event data (e.g., bad_debt_assets) or a state read/reconciliation pass.
				dbupdater.UpdateAPRHistory(client, liquidateEvent.MarketID, liquidateEvent.SupplyAPR, liquidateEvent.BorrowAPR, liquidateEvent.Timestamp)
			}
		case "AccrueInterest":
			dbupdater.ProcessAccrueInterest(tx)
		case "SupplyCollateral":
			dbupdater.ProcessSupplyCollateral(tx)
		case "WithdrawCollateral":
			dbupdater.ProcessWithdrawCollateral(tx)
		case "StorageDeposit":
			continue
		}
	}
}

// extractCreateMarketFields extracts fields from a CreateMarket event
func extractCreateMarketFields(event map[string]interface{}) (*CreateMarketEvent, bool) {
	requiredFields := []string{"market_id", "loan_token", "collateral_token", "currentTimestamp"}

	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		slog.Error("failed to extract create market fields", "event", event)
		return nil, false
	}

	return &CreateMarketEvent{
		MarketID:        fields["market_id"],
		LoanToken:       fields["loan_token"],
		CollateralToken: fields["collateral_token"],
		Timestamp:       fields["currentTimestamp"],
	}, true
}

// extractSupplyFields extracts fields from a Supply event
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

// extractWithdrawFields extracts all fields from a Withdraw event
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

// extractBorrowFields extracts all fields from a Borrow event
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

// extractRepayFields extracts all fields from a Repay event
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
