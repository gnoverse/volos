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
		slog.Error("Transaction missing 'response' field",
			"transaction", tx,
		)
		return
	}
	events, ok := response["events"].([]interface{})
	if !ok || len(events) == 0 {
		slog.Error("Transaction missing or empty 'events' array",
			"response", response,
		)
		return
	}

	for _, eventInterface := range events {
		event, ok := eventInterface.(map[string]interface{})
		if !ok {
			slog.Error("Event is not a map",
				"event_interface", eventInterface,
			)
			continue
		}

		eventType, ok := event["type"].(string)
		if !ok {
			slog.Error("Event type is not a string",
				"event", event,
			)
			continue
		}

		switch eventType {
		case "CreateMarket":
			marketID, loanToken, collateralToken, timestamp, ok := extractCreateMarketFields(event)
			if ok {
				err := dbupdater.CreateMarket(client, marketID, loanToken, collateralToken, timestamp)
				if err != nil {
					slog.Error("Error creating market",
						"market_id", marketID,
						"loan_token", loanToken,
						"collateral_token", collateralToken,
						"timestamp", timestamp,
						"error", err,
					)
				}
			}

		case "Supply":
			marketID, _, _, amount, _, timestamp, _, _, ok := extractSupplyFields(event)
			if ok {
				err := dbupdater.UpdateTotalSupply(client, marketID, amount, timestamp, true)
				if err != nil {
					slog.Error("Error updating total supply",
						"market_id", marketID,
						"amount", amount,
						"timestamp", timestamp,
						"error", err,
					)
				}
			}
		case "Withdraw":
			marketID, _, _, _, amount, _, timestamp, _, _, ok := extractWithdrawFields(event)
			if ok {
				err := dbupdater.UpdateTotalSupply(client, marketID, amount, timestamp, false)
				if err != nil {
					slog.Error("Error updating total supply",
						"market_id", marketID,
						"error", err,
					)
				}
			}
		case "Borrow":
			marketID, _, _, _, amount, _, timestamp, _, _, ok := extractBorrowFields(event)
			if ok {
				err := dbupdater.UpdateTotalBorrow(client, marketID, amount, timestamp, true)
				if err != nil {
					slog.Error("Error updating total borrow",
						"market_id", marketID,
						"amount", amount,
						"timestamp", timestamp,
						"error", err,
					)
				}
			}
		case "Repay":
			marketID, _, _, amount, _, timestamp, _, _, ok := extractRepayFields(event)
			if ok {
				err := dbupdater.UpdateTotalBorrow(client, marketID, amount, timestamp, false)
				if err != nil {
					slog.Error("Error updating total borrow",
						"market_id", marketID,
						"amount", amount,
						"timestamp", timestamp,
						"error", err,
					)
				}
			}
		case "Liquidate":
			dbupdater.ProcessLiquidate(tx)
		case "RegisterIRM":
			dbupdater.ProcessRegisterIRM(tx)
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
		return "", "", "", "", false
	}

	return fields["market_id"], fields["loan_token"], fields["collateral_token"], fields["currentTimestamp"], true
}

// extractSupplyFields extracts fields from a Supply event
func extractSupplyFields(event map[string]interface{}) (marketID, user, onBehalf, amount, shares, timestamp, supplyAPR, borrowAPR string, ok bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		return "", "", "", "", "", "", "", "", false
	}

	return fields["market_id"], fields["user"], fields["on_behalf"], fields["amount"], fields["shares"], fields["currentTimestamp"], fields["supplyAPR"], fields["borrowAPR"], true
}

// extractWithdrawFields extracts all fields from a Withdraw event
func extractWithdrawFields(event map[string]interface{}) (marketID, user, onBehalf, receiver, amount, shares, timestamp, supplyAPR, borrowAPR string, ok bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "receiver", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		return "", "", "", "", "", "", "", "", "", false
	}

	return fields["market_id"], fields["user"], fields["on_behalf"], fields["receiver"], fields["amount"], fields["shares"], fields["currentTimestamp"], fields["supplyAPR"], fields["borrowAPR"], true
}

// extractBorrowFields extracts all fields from a Borrow event
func extractBorrowFields(event map[string]interface{}) (marketID, user, onBehalf, receiver, amount, shares, timestamp, supplyAPR, borrowAPR string, ok bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "receiver", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		return "", "", "", "", "", "", "", "", "", false
	}
	return fields["market_id"], fields["user"], fields["on_behalf"], fields["receiver"], fields["amount"], fields["shares"], fields["currentTimestamp"], fields["supplyAPR"], fields["borrowAPR"], true
}

// extractRepayFields extracts all fields from a Repay event
func extractRepayFields(event map[string]interface{}) (marketID, user, onBehalf, amount, shares, timestamp, supplyAPR, borrowAPR string, ok bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR"}
	fields, ok := extractEventFields(event, requiredFields, []string{})
	if !ok {
		return "", "", "", "", "", "", "", "", false
	}
	return fields["market_id"], fields["user"], fields["on_behalf"], fields["amount"], fields["shares"], fields["currentTimestamp"], fields["supplyAPR"], fields["borrowAPR"], true
}
