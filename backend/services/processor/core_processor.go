// Package processor provides concurrent transaction processing utilities for the backend.
//
// This file contains the core transaction processor that handles all transactions
// from the gno.land/r/volos/core package, including market operations, lending,
// borrowing, and other core protocol functionality.
package processor

import (
	"log"
	"volos-backend/services/dbupdater"

	"cloud.google.com/go/firestore"
)

// processCoreTransaction handles transactions from the core package, processing various
// event types such as CreateMarket, Supply, Withdraw, Borrow, Repay, Liquidate,
// RegisterIRM, AccrueInterest, SupplyCollateral, WithdrawCollateral, and authorization_set.
func processCoreTransaction(tx map[string]interface{}, client *firestore.Client) {
	response, ok := tx["response"].(map[string]interface{})
	if !ok {
		log.Println("Transaction missing 'response' field")
		return
	}
	events, ok := response["events"].([]interface{})
	if !ok || len(events) == 0 {
		log.Println("Transaction missing or empty 'events' array")
		return
	}

	for _, eventInterface := range events {
		event, ok := eventInterface.(map[string]interface{})
		if !ok {
			log.Println("Event is not a map")
			continue
		}

		eventType, ok := event["type"].(string)
		if !ok {
			log.Println("Event type is not a string")
			continue
		}

		switch eventType {
		case "CreateMarket":
			marketID, loanToken, collateralToken, timestamp, ok := extractCreateMarketFields(event)
			if ok {
				dbupdater.CreateMarket(client, marketID, loanToken, collateralToken, timestamp)
			}

		case "Supply":
			marketID, _, _, amount, _, timestamp, _, _, ok := extractSupplyFields(event)
			if ok {
				dbupdater.UpdateTotalSupply(client, marketID, amount, timestamp, true)
			}
		case "Withdraw":
			marketID, _, _, _, amount, _, timestamp, _, _, ok := extractWithdrawFields(event)
			if ok {
				dbupdater.UpdateTotalSupply(client, marketID, amount, timestamp, false)
			}
		case "Borrow":
			dbupdater.ProcessBorrow(tx)
		case "Repay":
			dbupdater.ProcessRepay(tx)
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

	fields, ok := extractEventFields(event, requiredFields)
	if !ok {
		return "", "", "", "", false
	}

	return fields["market_id"], fields["loan_token"], fields["collateral_token"], fields["currentTimestamp"], true
}

// extractSupplyFields extracts fields from a Supply event
func extractSupplyFields(event map[string]interface{}) (marketID, user, onBehalf, amount, shares, timestamp, supplyAPR, borrowAPR string, ok bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR"}
	fields, ok := extractEventFields(event, requiredFields)
	if !ok {
		return "", "", "", "", "", "", "", "", false
	}

	return fields["market_id"], fields["user"], fields["on_behalf"], fields["amount"], fields["shares"], fields["currentTimestamp"], fields["supplyAPR"], fields["borrowAPR"], true
}

// extractWithdrawFields extracts all fields from a Withdraw event
func extractWithdrawFields(event map[string]interface{}) (marketID, user, onBehalf, receiver, amount, shares, timestamp, supplyAPR, borrowAPR string, ok bool) {
	requiredFields := []string{"market_id", "user", "on_behalf", "receiver", "amount", "shares", "currentTimestamp", "supplyAPR", "borrowAPR"}
	fields, ok := extractEventFields(event, requiredFields)
	if !ok {
		return "", "", "", "", "", "", "", "", "", false
	}

	return fields["market_id"], fields["user"], fields["on_behalf"], fields["receiver"], fields["amount"], fields["shares"], fields["currentTimestamp"], fields["supplyAPR"], fields["borrowAPR"], true
}
