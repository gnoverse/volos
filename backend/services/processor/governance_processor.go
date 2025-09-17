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
	"volos-backend/model"
)

// processGovernanceTransaction handles transactions from the governance package, processing
// governance-related events such as proposal creation, voting, and execution.
func processGovernanceTransaction(tx map[string]interface{}, client *firestore.Client) {
	events := extractEventsFromTx(tx)
	if events == nil {
		return
	}

	for _, eventInterface := range events {
		event, eventType := getEventAndType(eventInterface)
		if event == nil || eventType == "" {
			continue
		}

		if event["pkg_path"].(string) != model.GovernancePkgPath {
			continue
		}

		switch eventType {
		case "ProposalCreated":
			if proposalEvent, ok := extractProposalFields(event); ok {
				dbupdater.CreateProposal(client, proposalEvent.ProposalID, proposalEvent.Title, proposalEvent.Body, proposalEvent.Proposer, proposalEvent.Deadline, proposalEvent.Quorum, proposalEvent.Timestamp)
			}

		case "ProposalExecuted":
			if executedEvent, ok := extractProposalIDAndStatus(event); ok {
				updates := map[string]interface{}{
					"status": executedEvent.Status,
				}
				dbupdater.UpdateProposal(client, executedEvent.ProposalID, updates)
			}

		case "VoteCast":
			if voteEvent, ok := extractVoteFields(event); ok {
				dbupdater.AddVote(client, voteEvent.ProposalID, voteEvent.Voter, voteEvent.Vote, voteEvent.Reason, voteEvent.Timestamp, voteEvent.XVLSAmount)
			}

		case "MemberAdded":
			if memberEvent, ok := extractMemberAddress(event); ok {
				dbupdater.AddDAOMember(client, memberEvent.Member)
			}

		case "MemberRemoved":
			if memberEvent, ok := extractMemberAddress(event); ok {
				dbupdater.RemoveDAOMember(client, memberEvent.Member)
			}

		case "Stake":
			if stakeEvent, ok := extractStakeFields(event); ok {
				timestamp := utils.ParseTimestamp(stakeEvent.Timestamp, "stake event")
				if timestamp > 0 {
					dbupdater.UpdateUserStakedVLS(client, stakeEvent.Staker, stakeEvent.Delegatee, stakeEvent.Amount, timestamp)
				}
			}

		case "BeginUnstake":
			if unstakeEvent, ok := extractBeginUnstakeFields(event); ok {
				timestamp := utils.ParseTimestamp(unstakeEvent.Timestamp, "begin unstake event")
				if timestamp > 0 {
					dbupdater.UpdateUserStakedVLS(client, unstakeEvent.Staker, unstakeEvent.Delegatee, -unstakeEvent.Amount, timestamp)
					dbupdater.AddPendingUnstake(client, unstakeEvent.Staker, unstakeEvent.Delegatee, unstakeEvent.UnstakeID, unstakeEvent.Amount, unstakeEvent.UnlockAt)
				}
			}

		case "Withdraw":
			if withdrawEvent, ok := extractWithdrawnUnstakeIDs(event); ok && len(withdrawEvent.WithdrawnIDs) > 0 {
				dbupdater.DeletePendingUnstakesByIDs(client, withdrawEvent.Staker, withdrawEvent.WithdrawnIDs)
			}

		case "StorageDeposit":
			continue
		}
	}
}

// extractProposalFields extracts proposal fields from a transaction event
func extractProposalFields(event map[string]interface{}) (*ProposalCreatedEvent, bool) {
	required := []string{"proposal_id", "title", "caller", "deadline", "quorum", "timestamp", "body"}
	fields, ok := extractEventFields(event, required, []string{})
	if !ok {
		slog.Error("failed to extract proposal fields", "event", event)
		return nil, false
	}

	return &ProposalCreatedEvent{
		ProposalID: fields["proposal_id"],
		Title:      fields["title"],
		Body:       fields["body"],
		Proposer:   fields["caller"],
		Deadline:   fields["deadline"],
		Quorum:     fields["quorum"],
		Timestamp:  fields["timestamp"],
	}, true
}

// extractProposalIDAndStatus extracts the proposal ID and status from a ProposalExecuted event
func extractProposalIDAndStatus(event map[string]interface{}) (*ProposalExecutedEvent, bool) {
	required := []string{"proposal_id", "status"}
	fields, ok := extractEventFields(event, required, []string{})
	if !ok {
		slog.Error("failed to extract proposal ID and status", "event", event)
		return nil, false
	}
	return &ProposalExecutedEvent{
		ProposalID: fields["proposal_id"],
		Status:     fields["status"],
	}, true
}

// extractVoteFields extracts vote fields from a VoteCast event
func extractVoteFields(event map[string]interface{}) (*VoteCastEvent, bool) {
	required := []string{"proposal_id", "voter", "vote", "xvls_amount", "timestamp"}
	optional := []string{"reason"}
	fields, ok := extractEventFields(event, required, optional)
	if !ok {
		slog.Error("failed to extract vote fields", "event", event)
		return nil, false
	}

	amountStr := fields["xvls_amount"]
	amt := utils.ParseInt64(amountStr, "xVLS amount")
	if amt == 0 {
		return nil, false
	}
	return &VoteCastEvent{
		ProposalID: fields["proposal_id"],
		Voter:      fields["voter"],
		Vote:       fields["vote"],
		Reason:     fields["reason"],
		XVLSAmount: amt,
		Timestamp:  fields["timestamp"],
	}, true
}

// extractMemberAddress extracts the member address from MemberAdded/MemberRemoved events
func extractMemberAddress(event map[string]interface{}) (*MemberEvent, bool) {
	required := []string{"member"}
	fields, ok := extractEventFields(event, required, []string{})
	if !ok {
		slog.Error("member event missing attributes", "event", event)
		return nil, false
	}
	return &MemberEvent{
		Member: fields["member"],
	}, true
}

// extractStakeFields extracts stake fields from a Stake event
func extractStakeFields(event map[string]interface{}) (*StakeEvent, bool) {
	required := []string{"staker", "delegatee", "amount", "timestamp", "cooldown_period"}
	fields, ok := extractEventFields(event, required, []string{})
	if !ok {
		slog.Error("failed to extract stake fields", "event", event)
		return nil, false
	}

	amt := utils.ParseInt64(fields["amount"], "stake amount")
	if amt == 0 {
		return nil, false
	}

	cooldown := utils.ParseInt64(fields["cooldown_period"], "cooldown period")

	return &StakeEvent{
		Staker:         fields["staker"],
		Delegatee:      fields["delegatee"],
		Amount:         amt,
		CooldownPeriod: cooldown,
		Timestamp:      fields["timestamp"],
	}, true
}

// extractBeginUnstakeFields extracts fields from a BeginUnstake event
func extractBeginUnstakeFields(event map[string]interface{}) (*BeginUnstakeEvent, bool) {
	required := []string{"staker", "delegatee", "amount", "timestamp", "unstake_id"}
	fields, ok := extractEventFields(event, required, []string{})
	if !ok {
		slog.Error("failed to extract begin unstake fields", "event", event)
		return nil, false
	}

	amt := utils.ParseInt64(fields["amount"], "unstake amount")
	if amt == 0 {
		return nil, false
	}

	unlock := utils.ParseInt64(fields["unlock_at"], "unlock_at timestamp")

	return &BeginUnstakeEvent{
		Staker:    fields["staker"],
		Delegatee: fields["delegatee"],
		Amount:    amt,
		UnlockAt:  unlock,
		Timestamp: fields["timestamp"],
		UnstakeID: fields["unstake_id"],
	}, true
}

// extractWithdrawnUnstakeIDs extracts the staker and the list of withdrawn unstake IDs from a Withdraw event
func extractWithdrawnUnstakeIDs(event map[string]interface{}) (*GovernanceWithdrawEvent, bool) {
	required := []string{"staker", "withdrawn_unstake_ids"}
	fields, ok := extractEventFields(event, required, []string{})
	if !ok {
		slog.Error("failed to extract withdrawn unstake IDs", "event", event)
		return nil, false
	}

	idsStr := fields["withdrawn_unstake_ids"]
	if idsStr == "" {
		return &GovernanceWithdrawEvent{
			Staker:       fields["staker"],
			WithdrawnIDs: nil,
		}, true
	}

	parts := strings.Split(idsStr, ",")
	var withdrawnIDs []string
	for _, p := range parts {
		id := strings.TrimSpace(p)
		if id != "" {
			withdrawnIDs = append(withdrawnIDs, id)
		}
	}
	return &GovernanceWithdrawEvent{
		Staker:       fields["staker"],
		WithdrawnIDs: withdrawnIDs,
	}, true
}
