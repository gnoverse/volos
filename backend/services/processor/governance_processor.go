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

		case "StorageDeposit":
			continue
		}
	}
}

// extractProposalFields extracts proposal fields from a transaction event
func extractProposalFields(event map[string]interface{}) (proposalID, title, body, proposer, deadline, quorum, timestamp string, ok bool) {
	required := []string{"proposal_id", "title", "caller", "deadline", "quorum", "timestamp", "body"}
	fields, ok := extractEventFields(event, required)
	if !ok {
		return "", "", "", "", "", "", "", false
	}

	return fields["proposal_id"], fields["title"], fields["body"], fields["caller"], fields["deadline"], fields["quorum"], fields["timestamp"], true
}

// extractProposalIDAndStatus extracts the proposal ID and status from a ProposalExecuted event
func extractProposalIDAndStatus(event map[string]interface{}) (proposalID, status string) {
	required := []string{"proposal_id", "status"}
	fields, ok := extractEventFields(event, required)
	if !ok {
		return "", ""
	}
	return fields["proposal_id"], fields["status"]
}

// extractVoteFields extracts vote fields from a VoteCast event
func extractVoteFields(event map[string]interface{}) (proposalID, voter, vote, reason string, xvlsAmount int64, timestamp string, ok bool) {
	required := []string{"proposal_id", "voter", "vote", "xvls_amount", "timestamp", "reason"}
	fields, ok := extractEventFields(event, required)
	if !ok {
		return "", "", "", "", 0, "", false
	}

	amountStr := fields["xvls_amount"]
	amt, err := strconv.ParseInt(amountStr, 10, 64)
	if err != nil {
		log.Printf("Error parsing xVLS amount: %v", err)
		return "", "", "", "", 0, "", false
	}
	return fields["proposal_id"], fields["voter"], fields["vote"], fields["reason"], amt, fields["timestamp"], true
}

// extractMemberAddress extracts the member address from MemberAdded/MemberRemoved events
func extractMemberAddress(event map[string]interface{}) string {
	required := []string{"member"}
	fields, ok := extractEventFields(event, required)
	if !ok {
		log.Println("Member event missing attributes")
		return ""
	}
	return fields["member"]
}

// extractStakeFields extracts stake fields from a Stake event
func extractStakeFields(event map[string]interface{}) (staker, delegatee string, amount, cooldownPeriod int64, timestamp string, ok bool) {
	required := []string{"staker", "delegatee", "amount", "timestamp", "cooldown_period"}
	fields, ok := extractEventFields(event, required)
	if !ok {
		return "", "", 0, 0, "", false
	}

	amt, err := strconv.ParseInt(fields["amount"], 10, 64)
	if err != nil {
		log.Printf("Error parsing stake amount: %v", err)
		return "", "", 0, 0, "", false
	}

	cooldown := int64(0)
	if cp := fields["cooldown_period"]; cp != "" {
		if v, err := strconv.ParseInt(cp, 10, 64); err == nil {
			cooldown = v
		} else {
			log.Printf("Error parsing cooldown period: %v", err)
			return "", "", 0, 0, "", false
		}
	}

	return fields["staker"], fields["delegatee"], amt, cooldown, fields["timestamp"], true
}

// extractBeginUnstakeFields extracts fields from a BeginUnstake event
func extractBeginUnstakeFields(event map[string]interface{}) (staker, delegatee string, amount, unlockAt int64, timestamp, unstake_id string, ok bool) {
	required := []string{"staker", "delegatee", "amount", "timestamp", "unstake_id"}
	fields, ok := extractEventFields(event, required)
	if !ok {
		return "", "", 0, 0, "", "", false
	}

	amt, err := strconv.ParseInt(fields["amount"], 10, 64)
	if err != nil {
		log.Printf("Error parsing unstake amount: %v", err)
		return "", "", 0, 0, "", "", false
	}

	unlock := int64(0)
	if ua := fields["unlock_at"]; ua != "" {
		if v, err := strconv.ParseInt(ua, 10, 64); err == nil {
			unlock = v
		} else {
			log.Printf("Error parsing unlock_at timestamp: %v", err)
			return "", "", 0, 0, "", "", false
		}
	}

	return fields["staker"], fields["delegatee"], amt, unlock, fields["timestamp"], fields["unstake_id"], true
}

// extractWithdrawnUnstakeIDs extracts the staker and the list of withdrawn unstake IDs from a Withdraw event
func extractWithdrawnUnstakeIDs(event map[string]interface{}) (staker string, withdrawnIDs []string, ok bool) {
	required := []string{"staker", "withdrawn_unstake_ids"}
	fields, ok := extractEventFields(event, required)
	if !ok {
		return "", nil, false
	}

	idsStr := fields["withdrawn_unstake_ids"]
	if idsStr == "" {
		return fields["staker"], nil, true
	}

	parts := strings.Split(idsStr, ",")
	for _, p := range parts {
		id := strings.TrimSpace(p)
		if id != "" {
			withdrawnIDs = append(withdrawnIDs, id)
		}
	}
	return fields["staker"], withdrawnIDs, true
}
