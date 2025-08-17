// Package processor provides concurrent transaction processing utilities for the backend.
//
// This file contains the governance transaction processor that handles all transactions
// from the gno.land/r/volos/gov/governance package, including proposal creation,
// voting, execution, and other governance-related functionality.
package processor

import (
	"log"
	"strconv"
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
			proposalData := extractProposalFields(event)
			if proposalData != nil {
				err := dbupdater.CreateProposal(client, proposalData.ID, proposalData.Title,
					proposalData.Body, proposalData.Proposer, proposalData.Deadline, proposalData.Quorum)
				if err != nil {
					log.Printf("Error creating proposal in database: %v", err)
				}
			}
		case "ProposalExecuted":
			proposalID := extractProposalID(event)
			if proposalID != "" {
				updates := map[string]interface{}{
					"status": "executed",
				}
				err := dbupdater.UpdateProposal(client, proposalID, updates)
				if err != nil {
					log.Printf("Error updating proposal status in database: %v", err)
				}
			}
		case "VoteCast":
			proposalID, voter, vote, reason, xvlsAmount, ok := extractVoteFields(event)
			if ok {
				err := dbupdater.AddVote(client, proposalID, voter, vote, reason, xvlsAmount)
				if err != nil {
					log.Printf("Error adding vote to database: %v", err)
				}
			}
		case "MemberAdded":
			member := extractMemberAddress(event)
			if member != "" {
				err := dbupdater.AddDAOMember(client, member)
				if err != nil {
					log.Printf("Error adding DAO member to database: %v", err)
				}
			}
		case "MemberRemoved":
			member := extractMemberAddress(event)
			if member != "" {
				err := dbupdater.RemoveDAOMember(client, member)
				if err != nil {
					log.Printf("Error removing DAO member from database: %v", err)
				}
			}
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

	var proposalID, title, body, deadline, proposer, quorum string
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
			proposer = value
		case "quorum":
			quorum = value
		}
	}

	if proposalID == "" || title == "" || proposer == "" || deadline == "" || quorum == "" {
		log.Println("Missing required proposal fields")
		return nil
	}

	return &model.ProposalFields{
		ID:        proposalID,
		Title:     title,
		Body:      body,
		Proposer:  proposer,
		Deadline:  deadline,
		Quorum:    quorum,
	}
}

// extractProposalID extracts the proposal ID from a ProposalExecuted event
func extractProposalID(event map[string]interface{}) string {
	attributes, ok := event["attrs"].([]interface{})
	if !ok {
		log.Println("ProposalExecuted event missing attributes")
		return ""
	}

	for _, attr := range attributes {
		attrMap, ok := attr.(map[string]interface{})
		if !ok {
			continue
		}

		key, _ := attrMap["key"].(string)
		value, _ := attrMap["value"].(string)

		if key == "proposal_id" {
			return value
		}
	}

	log.Println("Proposal ID not found in ProposalExecuted event")
	return ""
}

// extractVoteFields extracts vote fields from a VoteCast event
func extractVoteFields(event map[string]interface{}) (proposalID, voter, vote, reason string, xvlsAmount int64, ok bool) {
	attributes, ok := event["attrs"].([]interface{})
	if !ok {
		log.Println("VoteCast event missing attributes")
		return "", "", "", "", 0, false
	}

	var proposalIDStr, voterStr, voteStr, reasonStr, xvlsAmountStr string
	for _, attr := range attributes {
		attrMap, ok := attr.(map[string]interface{})
		if !ok {
			continue
		}

		key, _ := attrMap["key"].(string)
		value, _ := attrMap["value"].(string)

		switch key {
		case "proposal_id":
			proposalIDStr = value
		case "voter":
			voterStr = value
		case "vote":
			voteStr = value
		case "reason":
			reasonStr = value
		case "xvls_amount":
			xvlsAmountStr = value
		}
	}

	if proposalIDStr == "" || voterStr == "" || voteStr == "" || xvlsAmountStr == "" {
		log.Println("Missing required vote fields")
		return "", "", "", "", 0, false
	}

	xvlsAmount, err := strconv.ParseInt(xvlsAmountStr, 10, 64)
	if err != nil {
		log.Printf("Error parsing xVLS amount: %v", err)
		return "", "", "", "", 0, false
	}

	return proposalIDStr, voterStr, voteStr, reasonStr, xvlsAmount, true
}

// extractMemberAddress extracts the member address from MemberAdded/MemberRemoved events
func extractMemberAddress(event map[string]interface{}) string {
	attributes, ok := event["attrs"].([]interface{})
	if !ok {
		log.Println("Member event missing attributes")
		return ""
	}

	for _, attr := range attributes {
		attrMap, ok := attr.(map[string]interface{})
		if !ok {
			continue
		}

		key, _ := attrMap["key"].(string)
		value, _ := attrMap["value"].(string)

		if key == "member" {
			return value
		}
	}

	log.Println("Member address not found in MemberAdded/MemberRemoved event")
	return ""
}
