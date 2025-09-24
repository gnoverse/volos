package governance

import (
	"std"
	"strconv"
	"time"
)

// Events
const (
	EventProposalCreated          = "ProposalCreated"
	EventProposalExecuted         = "ProposalExecuted"
	EventVoteCast                 = "VoteCast"
	EventMemberAdded              = "MemberAdded"
	EventMemberRemoved            = "MemberRemoved"
	EventGovernanceUpdated        = "GovernanceUpdated"
	EventVotingPowerQuorumUpdated = "VotingPowerQuorumUpdated"
	EventProposalThresholdUpdated = "ProposalThresholdUpdated"
)

// Attribute key names
const (
	ProposalIDKey   = "proposal_id"
	TitleKey        = "title"
	BodyKey         = "body"
	DeadlineKey     = "deadline"
	ExecutedKey     = "executed"
	VoterKey        = "voter"
	VoteKey         = "vote"
	ReasonKey       = "reason"
	MemberKey       = "member"
	OldPkgPathKey   = "old_pkg_path"
	NewPkgPathKey   = "new_pkg_path"
	CallerKey       = "caller"
	TimestampKey    = "timestamp"
	TotalMembersKey = "total_members"
	VoteCountKey    = "vote_count"
	YesVotesKey     = "yes_votes"
	NoVotesKey      = "no_votes"
	AbstainVotesKey = "abstain_votes"
	OldQuorumKey    = "old_quorum"
	NewQuorumKey    = "new_quorum"
	OldThresholdKey = "old_threshold"
	NewThresholdKey = "new_threshold"
	QuorumKey       = "quorum"
	XvlsAmountKey   = "xvls_amount"
	StatusKey       = "status"
)

func emitProposalCreated(caller std.Address, proposalID uint64, title, body string, deadline, quorum int64) {
	std.Emit(
		"ProposalCreated",
		CallerKey, caller.String(),
		ProposalIDKey, strconv.FormatUint(proposalID, 10),
		TitleKey, title,
		BodyKey, body,
		DeadlineKey, strconv.FormatInt(deadline, 10),
		QuorumKey, strconv.FormatInt(quorum, 10),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitProposalExecuted(caller std.Address, proposalID uint64, status string) {
	std.Emit(
		"ProposalExecuted",
		CallerKey, caller.String(),
		ProposalIDKey, strconv.FormatUint(proposalID, 10),
		StatusKey, status,
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitVoteCast(caller, voter std.Address, proposalID uint64, xvlsAmount int64, vote, reason string) {
	std.Emit(
		"VoteCast",
		CallerKey, caller.String(),
		VoterKey, voter.String(),
		ProposalIDKey, strconv.FormatUint(proposalID, 10),
		VoteKey, vote,
		ReasonKey, reason,
		XvlsAmountKey, strconv.FormatInt(xvlsAmount, 10),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitMemberAdded(caller, member std.Address) {
	std.Emit(
		"MemberAdded",
		CallerKey, caller.String(),
		MemberKey, member.String(),
		TotalMembersKey, strconv.FormatInt(int64(volosGovernance.Members().Size()), 10),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitMemberRemoved(caller, member std.Address) {
	std.Emit(
		"MemberRemoved",
		CallerKey, caller.String(),
		MemberKey, member.String(),
		TotalMembersKey, strconv.FormatInt(int64(volosGovernance.Members().Size()), 10),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitGovernanceUpdated(caller std.Address, oldPkgPath, newPkgPath string) {
	std.Emit(
		"GovernanceUpdated",
		CallerKey, caller.String(),
		OldPkgPathKey, oldPkgPath,
		NewPkgPathKey, newPkgPath,
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitVotingPowerQuorumUpdated(caller std.Address, oldQuorum, newQuorum int64) {
	std.Emit(
		"VotingPowerQuorumUpdated",
		CallerKey, caller.String(),
		OldQuorumKey, strconv.FormatInt(oldQuorum, 10),
		NewQuorumKey, strconv.FormatInt(newQuorum, 10),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitProposalThresholdUpdated(caller std.Address, oldThreshold, newThreshold int64) {
	std.Emit(
		"ProposalThresholdUpdated",
		CallerKey, caller.String(),
		OldThresholdKey, strconv.FormatInt(oldThreshold, 10),
		NewThresholdKey, strconv.FormatInt(newThreshold, 10),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}
