// Package processor provides concurrent transaction processing utilities for the backend.
//
// This file contains the core transaction processor that handles all transactions
// from the gno.land/r/volos/core package, including market operations, lending,
// borrowing, and other core protocol functionality.
package processor

import (
	"log"
	"volos-backend/services/dbupdater"
)

// processCoreTransaction handles transactions from the core package, processing various
// event types such as CreateMarket, Supply, Withdraw, Borrow, Repay, Liquidate,
// RegisterIRM, AccrueInterest, SupplyCollateral, WithdrawCollateral, and authorization_set.
func processCoreTransaction(tx map[string]interface{}) {
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

	lastEvent, ok := events[len(events)-1].(map[string]interface{})
	if !ok {
		log.Println("Last event is not a map")
		return
	}
	eventType, ok := lastEvent["type"].(string)
	if !ok {
		log.Println("Event type is not a string")
		return
	}

	switch eventType {
	case "CreateMarket":
		dbupdater.ProcessCreateMarket(tx)
	case "Supply":
		dbupdater.ProcessSupply(tx)
	case "Withdraw":
		dbupdater.ProcessWithdraw(tx)
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
	default:
		log.Printf("Unknown core event type: %s", eventType)
	}
}
