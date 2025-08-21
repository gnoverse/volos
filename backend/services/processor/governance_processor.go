// Package processor provides concurrent transaction processing utilities for the backend.
//
// This file contains the governance transaction processor that handles all transactions
// from the gno.land/r/volos/gov/governance package, including proposal creation,
// voting, execution, and other governance-related functionality.
package processor

import (
	"log/slog"
	"strings"
	"volos-backend/services/dbupdater"
	"volos-backend/services/utils"

	"cloud.google.com/go/firestore"
)

// processGovernanceTransaction handles transactions from the governance package, processing
// governance-related events such as proposal creation, voting, and execution.
func processGovernanceTransaction(tx map[string]interface{}, client *firestore.Client) {
	response, ok := tx["response"].(map[string]interface{})
	if !ok {
		slog.Error("transaction missing 'response' field",
			"transaction", tx,
		)
		return
	}
	events, ok := response["events"].([]interface{})
	if !ok || len(events) == 0 {
		slog.Error("transaction missing or empty 'events' array",
			"response", response,
		)
		return
	}

	for _, eventInterface := range events {
		event, ok := eventInterface.(map[string]interface{})
		if !ok {
			slog.Error("event is not a map",
				"event_interface", eventInterface,
			)
			continue
		}

		eventType, ok := event["type"].(string)
		if !ok {
			slog.Error("event type is not a string",
				"event", event,
			)
			continue
		}

		switch eventType {
		case "ProposalCreated":
			proposalID, title, body, proposer, deadline, quorum, timestamp, ok := extractProposalFields(event)
			if ok {
				dbupdater.CreateProposal(client, proposalID, title, body, proposer, deadline, quorum, timestamp)
			}

		case "ProposalExecuted":
			proposalID, status := extractProposalIDAndStatus(event)
			if proposalID != "" {
				updates := map[string]interface{}{
					"status": status,
				}
				dbupdater.UpdateProposal(client, proposalID, updates)
			}

		case "VoteCast":
			proposalID, voter, vote, reason, xvlsAmount, timestamp, ok := extractVoteFields(event)
			if ok {
				dbupdater.AddVote(client, proposalID, voter, vote, reason, timestamp, xvlsAmount)
			}

		case "MemberAdded":
			member := extractMemberAddress(event)
			if member != "" {
				dbupdater.AddDAOMember(client, member)
			}

		case "MemberRemoved":
			member := extractMemberAddress(event)
			if member != "" {
				dbupdater.RemoveDAOMember(client, member)
			}

		case "Stake":
			staker, delegatee, amount, _, timestampStr, ok := extractStakeFields(event)
			if ok {
				timestamp := utils.ParseTimestamp(timestampStr, "stake event")
				if timestamp > 0 {
					dbupdater.UpdateUserStakedVLS(client, staker, delegatee, amount, timestamp)
				}
			}

		case "BeginUnstake":
			staker, delegatee, amount, unlockAt, timestampStr, unstakeId, ok := extractBeginUnstakeFields(event)
			if ok {
				timestamp := utils.ParseTimestamp(timestampStr, "begin unstake event")
				if timestamp > 0 {
					dbupdater.UpdateUserStakedVLS(client, staker, delegatee, -amount, timestamp)
					dbupdater.AddPendingUnstake(client, staker, delegatee, unstakeId, amount, unlockAt)
				}
			}

		case "Withdraw":
			staker, withdrawnIDs, ok := extractWithdrawnUnstakeIDs(event)
			if ok && len(withdrawnIDs) > 0 {
				dbupdater.DeletePendingUnstakesByIDs(client, staker, withdrawnIDs)
			}

		case "StorageDeposit":
			continue
		}
	}
}

// extractProposalFields extracts proposal fields from a transaction event
func extractProposalFields(event map[string]interface{}) (proposalID, title, body, proposer, deadline, quorum, timestamp string, ok bool) {
	required := []string{"proposal_id", "title", "caller", "deadline", "quorum", "timestamp", "body"}
	fields, ok := extractEventFields(event, required, []string{})
	if !ok {
		slog.Error("failed to extract proposal fields",
			"event", event,
		)
		return "", "", "", "", "", "", "", false
	}

	return fields["proposal_id"], fields["title"], fields["body"], fields["caller"], fields["deadline"], fields["quorum"], fields["timestamp"], true
}

// extractProposalIDAndStatus extracts the proposal ID and status from a ProposalExecuted event
func extractProposalIDAndStatus(event map[string]interface{}) (proposalID, status string) {
	required := []string{"proposal_id", "status"}
	fields, ok := extractEventFields(event, required, []string{})
	if !ok {
		slog.Error("failed to extract proposal ID and status",
			"event", event,
		)
		return "", ""
	}
	return fields["proposal_id"], fields["status"]
}

// extractVoteFields extracts vote fields from a VoteCast event
func extractVoteFields(event map[string]interface{}) (proposalID, voter, vote, reason string, xvlsAmount int64, timestamp string, ok bool) {
	required := []string{"proposal_id", "voter", "vote", "xvls_amount", "timestamp"}
	optional := []string{"reason"}
	fields, ok := extractEventFields(event, required, optional)
	if !ok {
		slog.Error("failed to extract vote fields",
			"event", event,
		)
		return "", "", "", "", 0, "", false
	}

	amountStr := fields["xvls_amount"]
	amt := utils.ParseInt64(amountStr, "xVLS amount")
	if amt == 0 {
		return "", "", "", "", 0, "", false
	}
	return fields["proposal_id"], fields["voter"], fields["vote"], fields["reason"], amt, fields["timestamp"], true
}

// extractMemberAddress extracts the member address from MemberAdded/MemberRemoved events
func extractMemberAddress(event map[string]interface{}) string {
	required := []string{"member"}
	fields, ok := extractEventFields(event, required, []string{})
	if !ok {
		slog.Error("member event missing attributes",
			"event", event,
		)
		return ""
	}
	return fields["member"]
}

// extractStakeFields extracts stake fields from a Stake event
func extractStakeFields(event map[string]interface{}) (staker, delegatee string, amount, cooldownPeriod int64, timestamp string, ok bool) {
	required := []string{"staker", "delegatee", "amount", "timestamp", "cooldown_period"}
	fields, ok := extractEventFields(event, required, []string{})
	if !ok {
		slog.Error("failed to extract stake fields",
			"event", event,
		)
		return "", "", 0, 0, "", false
	}

	amt := utils.ParseInt64(fields["amount"], "stake amount")
	if amt == 0 {
		return "", "", 0, 0, "", false
	}

	cooldown := utils.ParseInt64(fields["cooldown_period"], "cooldown period")

	return fields["staker"], fields["delegatee"], amt, cooldown, fields["timestamp"], true
}

// extractBeginUnstakeFields extracts fields from a BeginUnstake event
func extractBeginUnstakeFields(event map[string]interface{}) (staker, delegatee string, amount, unlockAt int64, timestamp, unstake_id string, ok bool) {
	required := []string{"staker", "delegatee", "amount", "timestamp", "unstake_id"}
	fields, ok := extractEventFields(event, required, []string{})
	if !ok {
		slog.Error("failed to extract begin unstake fields",
			"event", event,
		)
		return "", "", 0, 0, "", "", false
	}

	amt := utils.ParseInt64(fields["amount"], "unstake amount")
	if amt == 0 {
		return "", "", 0, 0, "", "", false
	}

	unlock := utils.ParseInt64(fields["unlock_at"], "unlock_at timestamp")

	return fields["staker"], fields["delegatee"], amt, unlock, fields["timestamp"], fields["unstake_id"], true
}

// extractWithdrawnUnstakeIDs extracts the staker and the list of withdrawn unstake IDs from a Withdraw event
func extractWithdrawnUnstakeIDs(event map[string]interface{}) (staker string, withdrawnIDs []string, ok bool) {
	required := []string{"staker", "withdrawn_unstake_ids"}
	fields, ok := extractEventFields(event, required, []string{})
	if !ok {
		slog.Error("failed to extract withdrawn unstake IDs",
			"event", event,
		)
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
