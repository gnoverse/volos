package staker

import (
	"std"
	"strconv"
	"strings"
	"time"

	"gno.land/p/demo/seqid"
)

// Events
const (
	EventStake         = "Stake"
	EventBeginUnstake  = "BeginUnstake"
	EventWithdraw      = "Withdraw"
	EventMemberAdded   = "MemberAdded"
	EventMemberRemoved = "MemberRemoved"
)

// Attribute key names
const (
	StakerKey              = "staker"
	DelegateeKey           = "delegatee"
	AmountKey              = "amount"
	UnlockAtKey            = "unlock_at"
	UnstakeIDKey           = "unstake_id"
	MemberKey              = "member"
	TotalWithdrawnKey      = "total_withdrawn"
	RemainingUnstakesKey   = "remaining_unstakes"
	WithdrawnUnstakeIDsKey = "withdrawn_unstake_ids"
	CallerKey              = "caller"
	TimestampKey           = "timestamp"
	CooldownPeriodKey      = "cooldown_period"
	PendingUnstakesKey     = "pending_unstakes"
	VlsBalanceKey          = "vls_balance"
	XvlsBalanceKey         = "xvls_balance"
	UnstakeInfoKey         = "unstake_info"
)

func emitStake(caller, staker, delegatee std.Address, amount int64) {
	std.Emit(
		"Stake",
		CallerKey, caller.String(),
		StakerKey, staker.String(),
		DelegateeKey, delegatee.String(),
		AmountKey, strconv.FormatInt(amount, 10),
		CooldownPeriodKey, strconv.FormatInt(UnstakeLockPeriod(), 10),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitBeginUnstake(caller, staker, delegatee std.Address, amount int64, unlockAt int64, id seqid.ID) {
	std.Emit(
		"BeginUnstake",
		CallerKey, caller.String(),
		StakerKey, staker.String(),
		DelegateeKey, delegatee.String(),
		AmountKey, strconv.FormatInt(amount, 10),
		UnlockAtKey, strconv.FormatInt(unlockAt, 10),
		UnstakeIDKey, id.String(),
		CooldownPeriodKey, strconv.FormatInt(UnstakeLockPeriod(), 10),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitWithdraw(caller, staker std.Address, totalWithdrawn int64, remainingUnstakes int, withdrawnIDs []string) {
	std.Emit(
		"Withdraw",
		CallerKey, caller.String(),
		StakerKey, staker.String(),
		TotalWithdrawnKey, strconv.FormatInt(totalWithdrawn, 10),
		RemainingUnstakesKey, strconv.Itoa(remainingUnstakes),
		WithdrawnUnstakeIDsKey, strings.Join(withdrawnIDs, ","),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitMemberAdded(caller, member std.Address) {
	std.Emit(
		"MemberAdded",
		CallerKey, caller.String(),
		MemberKey, member.String(),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitMemberRemoved(caller, member std.Address) {
	std.Emit(
		"MemberRemoved",
		CallerKey, caller.String(),
		MemberKey, member.String(),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}
