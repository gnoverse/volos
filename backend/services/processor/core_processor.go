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
			marketID, loanToken, collateralToken, timestamp, ok := extractCreateMarketFields(event)
			if ok {
				dbupdater.CreateMarket(client, marketID, loanToken, collateralToken, timestamp)
			}

		case "Supply":
			marketID, _, _, amount, _, timestamp, supplyAPR, borrowAPR, ok := extractSupplyFields(event)
			if ok {
				dbupdater.UpdateTotalSupply(client, marketID, amount, timestamp, true)
				dbupdater.UpdateAPRHistory(client, marketID, supplyAPR, borrowAPR, timestamp)
			}
		case "Withdraw":
			marketID, _, _, _, amount, _, timestamp, supplyAPR, borrowAPR, ok := extractWithdrawFields(event)
			if ok {
				dbupdater.UpdateTotalSupply(client, marketID, amount, timestamp, false)
				dbupdater.UpdateAPRHistory(client, marketID, supplyAPR, borrowAPR, timestamp)
			}
		case "Borrow":
			marketID, _, _, _, amount, _, timestamp, supplyAPR, borrowAPR, ok := extractBorrowFields(event)
			if ok {
				dbupdater.UpdateTotalBorrow(client, marketID, amount, timestamp, true)
				dbupdater.UpdateAPRHistory(client, marketID, supplyAPR, borrowAPR, timestamp)
			}
		case "Repay":
			marketID, _, _, amount, _, timestamp, supplyAPR, borrowAPR, ok := extractRepayFields(event)
			if ok {
				dbupdater.UpdateTotalBorrow(client, marketID, amount, timestamp, false)
				dbupdater.UpdateAPRHistory(client, marketID, supplyAPR, borrowAPR, timestamp)
			}
		case "Liquidate":
			marketID, _, _, amount, _, _, timestamp, supplyAPR, borrowAPR, ok := extractLiquidateFields(event)
			if ok {
				dbupdater.UpdateTotalBorrow(client, marketID, amount, timestamp, false)
				// TODO: If borrower collateral becomes zero, also decrease total_supply and any additional bad-debt borrow reduction.
				//       Requires extra event data (e.g., bad_debt_assets) or a state read/reconciliation pass.
				dbupdater.UpdateAPRHistory(client, marketID, supplyAPR, borrowAPR, timestamp)
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
func extractCreateMarketFields(event map[string]interface{}) (marketID, loanToken, collateralToken, timestamp string, ok bool) {
	requiredFields := []string{"market_id", "loan_token", "collateral_token", "currentTimestamp"}

	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		slog.Error("failed to extract create market fields", "event", event)
		return "", "", "", "", false
	}

	return fields["market_id"], fields["loan_token"], fields["collateral_token"], fields["currentTimestamp"], true
}

// extractSupplyFields extracts fields from a Supply event
func extractSupplyFields(event map[string]interface{}) (marketID, user, onBehalf, amount, shares, timestamp, supplyAPR, borrowAPR string, ok bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		slog.Error("failed to extract supply fields", "event", event)
		return "", "", "", "", "", "", "", "", false
	}

	return fields["market_id"], fields["user"], fields["on_behalf"], fields["amount"], fields["shares"], fields["currentTimestamp"], fields["supplyAPR"], fields["borrowAPR"], true
}

// extractWithdrawFields extracts all fields from a Withdraw event
func extractWithdrawFields(event map[string]interface{}) (marketID, user, onBehalf, receiver, amount, shares, timestamp, supplyAPR, borrowAPR string, ok bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "receiver", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		slog.Error("failed to extract withdraw fields", "event", event)
		return "", "", "", "", "", "", "", "", "", false
	}

	return fields["market_id"], fields["user"], fields["on_behalf"], fields["receiver"], fields["amount"], fields["shares"], fields["currentTimestamp"], fields["supplyAPR"], fields["borrowAPR"], true
}

// extractBorrowFields extracts all fields from a Borrow event
func extractBorrowFields(event map[string]interface{}) (marketID, user, onBehalf, receiver, amount, shares, timestamp, supplyAPR, borrowAPR string, ok bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "receiver", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		slog.Error("failed to extract borrow fields", "event", event)
		return "", "", "", "", "", "", "", "", "", false
	}
	return fields["market_id"], fields["user"], fields["on_behalf"], fields["receiver"], fields["amount"], fields["shares"], fields["currentTimestamp"], fields["supplyAPR"], fields["borrowAPR"], true
}

// extractRepayFields extracts all fields from a Repay event
func extractRepayFields(event map[string]interface{}) (marketID, user, onBehalf, amount, shares, timestamp, supplyAPR, borrowAPR string, ok bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		slog.Error("failed to extract repay fields", "event", event)
		return "", "", "", "", "", "", "", "", false
	}
	return fields["market_id"], fields["user"], fields["on_behalf"], fields["amount"], fields["shares"], fields["currentTimestamp"], fields["supplyAPR"], fields["borrowAPR"], true
}

func extractLiquidateFields(event map[string]interface{}) (marketID, user, borrower, amount, shares, seized, timestamp, supplyAPR, borrowAPR string, ok bool) {
	requiredFields := []string{"market_id", "user", "borrower", "amount", "shares", "seized", "currentTimestamp", "supplyAPR", "borrowAPR"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		slog.Error("failed to extract liquidate fields", "event", event)
		return "", "", "", "", "", "", "", "", "", false
	}
	return fields["market_id"], fields["user"], fields["borrower"], fields["amount"], fields["shares"], fields["seized"], fields["currentTimestamp"], fields["supplyAPR"], fields["borrowAPR"], true
}
