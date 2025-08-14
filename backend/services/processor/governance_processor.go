// Package processor provides concurrent transaction processing utilities for the backend.
//
// This file contains the governance transaction processor that handles all transactions
// from the gno.land/r/volos/gov/governance package, including proposal creation,
// voting, execution, and other governance-related functionality.
package processor

import (
	"log"
	"volos-backend/model"
	"volos-backend/services/dbupdater"

	"cloud.google.com/go/firestore"
)

// processGovernanceTransaction handles transactions from the governance package, processing
// governance-related events such as proposal creation, voting, and execution.
func processGovernanceTransaction(tx map[string]interface{}, client *firestore.Client) {
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
		case "ProposalCreated":
			log.Println("ProposalCreated event detected")
			proposalData := extractProposalFields(event)
			if proposalData != nil {
				err := dbupdater.CreateProposal(client, proposalData.ID, proposalData.Title,
					proposalData.Body, proposalData.Caller, proposalData.Deadline)
				if err != nil {
					log.Printf("Error creating proposal in database: %v", err)
				}
			}
		case "ProposalExecuted":
			//todo
		case "VoteCast":
			//todo
		case "MemberAdded":
			//todo
		case "MemberRemoved":
			//todo
		case "GovernanceUpdated":
			//todo
		default:
			log.Printf("Unknown governance event type: %s (some events may be processed with MsgRun transactions)", eventType)
		}
	}
}

// extractProposalFields is a helper function that extracts proposal fields from a transaction event
func extractProposalFields(event map[string]interface{}) *model.ProposalFields {
	attributes, ok := event["attrs"].([]interface{})
	if !ok {
		log.Println("ProposalCreated event missing attributes")
		return nil
	}

	var proposalID, title, body, deadline, caller string
	for _, attr := range attributes {
		attrMap, ok := attr.(map[string]interface{})
		if !ok {
			continue
		}

		key, _ := attrMap["key"].(string)
		value, _ := attrMap["value"].(string)

		switch key {
		case "proposal_id":
			proposalID = value
		case "title":
			title = value
		case "body":
			body = value
		case "deadline":
			deadline = value
		case "caller":
			caller = value
		}
	}

	if proposalID == "" || title == "" || caller == "" || deadline == "" {
		log.Println("Missing required proposal fields")
		return nil
	}

	return &model.ProposalFields{
		ID:       proposalID,
		Title:    title,
		Body:     body,
		Caller:   caller,
		Deadline: deadline,
	}
}
