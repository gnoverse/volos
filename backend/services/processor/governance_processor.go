// Package processor provides concurrent transaction processing utilities for the backend.
//
// This file contains the governance transaction processor that handles all transactions
// from the gno.land/r/volos/gov/governance package, including proposal creation,
// voting, execution, and other governance-related functionality.
package processor

import (
	"log"
	"strconv"
	"strings"
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
			proposalID, title, body, proposer, deadline, quorum, timestamp, ok := extractProposalFields(event)
			if ok {
				err := dbupdater.CreateProposal(client, proposalID, title, body, proposer, deadline, quorum, timestamp)
				if err != nil {
					log.Printf("Error creating proposal in database: %v", err)
				}
			}

		case "ProposalExecuted":
			proposalID, status := extractProposalIDAndStatus(event)
			if proposalID != "" {
				updates := map[string]interface{}{
					"status": status,
				}
				err := dbupdater.UpdateProposal(client, proposalID, updates)
				if err != nil {
					log.Printf("Error updating proposal status in database: %v", err)
				}
			}

		case "VoteCast":
			proposalID, voter, vote, reason, xvlsAmount, timestamp, ok := extractVoteFields(event)
			if ok {
				err := dbupdater.AddVote(client, proposalID, voter, vote, reason, timestamp, xvlsAmount)
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

		case "Stake":
			staker, delegatee, amount, _, timestampStr, ok := extractStakeFields(event)
			if ok {
				timestamp, _ := strconv.ParseInt(timestampStr, 10, 64)
				err := dbupdater.UpdateUserStakedVLS(client, staker, delegatee, amount, timestamp)
				if err != nil {
					log.Printf("Error updating staked VLS for user %s: %v", staker, err)
				}
			}

		case "BeginUnstake":
			staker, delegatee, amount, unlockAt, timestampStr, unstakeId, ok := extractBeginUnstakeFields(event)
			if ok {
				timestamp, _ := strconv.ParseInt(timestampStr, 10, 64)
				err := dbupdater.UpdateUserStakedVLS(client, staker, delegatee, -amount, timestamp)
				if err != nil {
					log.Printf("Error updating unstaked VLS for user %s: %v", staker, err)
				}

				err = dbupdater.AddPendingUnstake(client, staker, delegatee, unstakeId, amount, unlockAt)
				if err != nil {
					log.Printf("Error creating pending unstake for user %s: %v", staker, err)
				}
			}

		case "Withdraw":
			staker, withdrawnIDs, ok := extractWithdrawnUnstakeIDs(event)
			if ok && len(withdrawnIDs) > 0 {
				err := dbupdater.DeletePendingUnstakesByIDs(client, staker, withdrawnIDs)
				if err != nil {
					log.Printf("Error deleting withdrawn pending unstakes for user %s: %v", staker, err)
				}
			}
		}
	}
}

// extractProposalFields extracts proposal fields from a transaction event
func extractProposalFields(event map[string]interface{}) (proposalID, title, body, proposer, deadline, quorum, timestamp string, ok bool) {
	attributes, attrsOk := event["attrs"].([]interface{})
	if !attrsOk {
		log.Println("ProposalCreated event missing attributes")
		return "", "", "", "", "", "", "", false
	}

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
		case "timestamp":
			timestamp = value
		}
	}

	if proposalID == "" || title == "" || proposer == "" || deadline == "" || quorum == "" || timestamp == "" {
		log.Println("Missing required proposal fields")
		return "", "", "", "", "", "", "", false
	}

	return proposalID, title, body, proposer, deadline, quorum, timestamp, true
}

// extractProposalIDAndStatus extracts the proposal ID and status from a ProposalExecuted event
func extractProposalIDAndStatus(event map[string]interface{}) (proposalID, status string) {
	attributes, ok := event["attrs"].([]interface{})
	if !ok {
		log.Println("ProposalExecuted event missing attributes")
		return "", ""
	}

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
		case "status":
			status = value
		}
	}

	if proposalID == "" || status == "" {
		log.Println("Missing required fields in ProposalExecuted event - proposal_id:", proposalID, "status:", status)
		return "", ""
	}

	return proposalID, status
}

// extractVoteFields extracts vote fields from a VoteCast event
func extractVoteFields(event map[string]interface{}) (proposalID, voter, vote, reason string, xvlsAmount int64, timestamp string, ok bool) {
	attributes, ok := event["attrs"].([]interface{})
	if !ok {
		log.Println("VoteCast event missing attributes")
		return "", "", "", "", 0, "", false
	}

	var proposalIDStr, voterStr, voteStr, reasonStr, xvlsAmountStr, timestampStr string
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
		case "timestamp":
			timestampStr = value
		}
	}

	if proposalIDStr == "" || voterStr == "" || voteStr == "" || xvlsAmountStr == "" || timestampStr == "" {
		log.Println("Missing required vote fields")
		return "", "", "", "", 0, "", false
	}

	xvlsAmount, err := strconv.ParseInt(xvlsAmountStr, 10, 64)
	if err != nil {
		log.Printf("Error parsing xVLS amount: %v", err)
		return "", "", "", "", 0, "", false
	}

	return proposalIDStr, voterStr, voteStr, reasonStr, xvlsAmount, timestampStr, true
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

// extractStakeFields extracts stake fields from a Stake event
func extractStakeFields(event map[string]interface{}) (staker, delegatee string, amount, cooldownPeriod int64, timestamp string, ok bool) {
	attributes, attrsOk := event["attrs"].([]interface{})
	if !attrsOk {
		log.Println("Stake event missing attributes")
		return "", "", 0, 0, "", false
	}

	var stakerStr, delegateeStr, amountStr, cooldownPeriodStr, timestampStr string
	for _, attr := range attributes {
		attrMap, ok := attr.(map[string]interface{})
		if !ok {
			continue
		}

		key, _ := attrMap["key"].(string)
		value, _ := attrMap["value"].(string)

		switch key {
		case "staker":
			stakerStr = value
		case "delegatee":
			delegateeStr = value
		case "amount":
			amountStr = value
		case "cooldown_period":
			cooldownPeriodStr = value
		case "timestamp":
			timestampStr = value
		}
	}

	if stakerStr == "" || delegateeStr == "" || amountStr == "" || timestampStr == "" {
		log.Println("Missing required stake fields")
		return "", "", 0, 0, "", false
	}

	amountInt, err := strconv.ParseInt(amountStr, 10, 64)
	if err != nil {
		log.Printf("Error parsing stake amount: %v", err)
		return "", "", 0, 0, "", false
	}

	cooldownInt := int64(0)
	if cooldownPeriodStr != "" {
		cooldownInt, err = strconv.ParseInt(cooldownPeriodStr, 10, 64)
		if err != nil {
			log.Printf("Error parsing cooldown period: %v", err)
			return "", "", 0, 0, "", false
		}
	}

	return stakerStr, delegateeStr, amountInt, cooldownInt, timestampStr, true
}

// extractBeginUnstakeFields extracts fields from a BeginUnstake event
func extractBeginUnstakeFields(event map[string]interface{}) (staker, delegatee string, amount, unlockAt int64, timestamp, unstake_id string, ok bool) {
	attributes, attrsOk := event["attrs"].([]interface{})
	if !attrsOk {
		log.Println("BeginUnstake event missing attributes")
		return "", "", 0, 0, "", "", false
	}

	var stakerStr, delegateeStr, amountStr, unlockAtStr, timestampStr, unstakeIdStr string
	for _, attr := range attributes {
		attrMap, ok := attr.(map[string]interface{})
		if !ok {
			continue
		}

		key, _ := attrMap["key"].(string)
		value, _ := attrMap["value"].(string)

		switch key {
		case "staker":
			stakerStr = value
		case "delegatee":
			delegateeStr = value
		case "amount":
			amountStr = value
		case "unlock_at":
			unlockAtStr = value
		case "timestamp":
			timestampStr = value
		case "unstake_id":
			unstakeIdStr = value
		}
	}

	if stakerStr == "" || delegateeStr == "" || amountStr == "" || timestampStr == "" || unstakeIdStr == "" {
		log.Println("Missing required BeginUnstake fields")
		return "", "", 0, 0, "", "", false
	}

	amountInt, err := strconv.ParseInt(amountStr, 10, 64)
	if err != nil {
		log.Printf("Error parsing unstake amount: %v", err)
		return "", "", 0, 0, "", "", false
	}

	unlockAtInt := int64(0)
	if unlockAtStr != "" {
		unlockAtInt, err = strconv.ParseInt(unlockAtStr, 10, 64)
		if err != nil {
			log.Printf("Error parsing unlock_at timestamp: %v", err)
			return "", "", 0, 0, "", "", false
		}
	}

	return stakerStr, delegateeStr, amountInt, unlockAtInt, timestampStr, unstakeIdStr, true
}

// extractWithdrawnUnstakeIDs extracts the staker and the list of withdrawn unstake IDs from a Withdraw event
func extractWithdrawnUnstakeIDs(event map[string]interface{}) (staker string, withdrawnIDs []string, ok bool) {
	attributes, attrsOk := event["attrs"].([]interface{})
	if !attrsOk {
		log.Println("Withdraw event missing attributes")
		return "", nil, false
	}

	var stakerStr, idsStr string
	for _, attr := range attributes {
		attrMap, ok := attr.(map[string]interface{})
		if !ok {
			continue
		}

		key, _ := attrMap["key"].(string)
		value, _ := attrMap["value"].(string)

		switch key {
		case "staker":
			stakerStr = value
		case "withdrawn_unstake_ids":
			idsStr = value
		}
	}

	if stakerStr == "" {
		log.Println("Missing required Withdraw fields: staker")
		return "", nil, false
	}

	if idsStr == "" {
		// No IDs to process, but the event is valid
		return stakerStr, nil, true
	}

	// Split by comma and filter out empty entries
	parts := strings.Split(idsStr, ",")
	for _, p := range parts {
		id := strings.TrimSpace(p)
		if id != "" {
			withdrawnIDs = append(withdrawnIDs, id)
		}
	}

	return stakerStr, withdrawnIDs, true
}
