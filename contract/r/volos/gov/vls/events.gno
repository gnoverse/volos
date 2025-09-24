package vls

import (
	"std"
	"strconv"
	"time"
)

// Events
const (
	EventMint              = "Mint"
	EventBurn              = "Burn"
	EventTransfer          = "Transfer"
	EventApproval          = "Approval"
	EventGovernanceUpdated = "GovernanceUpdated"
)

// Attribute key names
const (
	FromKey        = "from"
	ToKey          = "to"
	AmountKey      = "amount"
	OwnerKey       = "owner"
	SpenderKey     = "spender"
	ValueKey       = "value"
	OldPkgPathKey  = "old_pkg_path"
	NewPkgPathKey  = "new_pkg_path"
	CallerKey      = "caller"
	TimestampKey   = "timestamp"
	TotalSupplyKey = "total_supply"
	BalanceKey     = "balance"
)

func emitMint(caller, to std.Address, amount int64) {
	std.Emit(
		"Mint",
		CallerKey, caller.String(),
		ToKey, to.String(),
		AmountKey, strconv.FormatInt(amount, 10),
		TotalSupplyKey, strconv.FormatInt(TotalSupply(), 10),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitBurn(caller, from std.Address, amount int64) {
	std.Emit(
		"Burn",
		CallerKey, caller.String(),
		FromKey, from.String(),
		AmountKey, strconv.FormatInt(amount, 10),
		TotalSupplyKey, strconv.FormatInt(TotalSupply(), 10),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitTransfer(caller, from, to std.Address, amount int64) {
	std.Emit(
		"Transfer",
		CallerKey, caller.String(),
		FromKey, from.String(),
		ToKey, to.String(),
		AmountKey, strconv.FormatInt(amount, 10),
		BalanceKey, strconv.FormatInt(BalanceOf(from), 10),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitApproval(owner, spender std.Address, value int64) {
	std.Emit(
		"Approval",
		OwnerKey, owner.String(),
		SpenderKey, spender.String(),
		ValueKey, strconv.FormatInt(value, 10),
		BalanceKey, strconv.FormatInt(BalanceOf(owner), 10),
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
