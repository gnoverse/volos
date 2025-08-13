// Package processor provides concurrent transaction processing utilities for the backend.
//
// This file contains the governance transaction processor that handles all transactions
// from the gno.land/r/volos/gov/governance package, including proposal creation,
// voting, execution, and other governance-related functionality.
package processor

import (
	"log"
)

// processGovernanceTransaction handles transactions from the governance package, processing
// governance-related events such as proposal creation, voting, and execution.
// Currently logs unknown governance event types for future implementation.
func processGovernanceTransaction(tx map[string]interface{}) {
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
	case "":
		// todo governance events
	default:
		log.Printf("Unknown governance event type: %s", eventType)
	}
}
