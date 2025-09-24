package xvls

import (
	"std"
	"strconv"
	"time"
)

// Events
const (
	EventMint         = "Mint"
	EventBurn         = "Burn"
	EventVotingSupply = "VotingSupply"
)

// Attribute key names
const (
	ToKey           = "to"
	FromKey         = "from"
	AmountKey       = "amount"
	TotalSupplyKey  = "total_supply"
	VotingSupplyKey = "voting_supply"
	ExcludedKey     = "excluded_balance"
	CallerKey       = "caller"
	TimestampKey    = "timestamp"
	BalanceKey      = "balance"
	LaunchpadKey    = "launchpad_address"
)

func emitMint(caller, to std.Address, amount int64) {
	std.Emit(
		"Mint",
		CallerKey, caller.String(),
		ToKey, to.String(),
		AmountKey, strconv.FormatInt(amount, 10),
		TotalSupplyKey, strconv.FormatInt(TotalSupply(), 10),
		VotingSupplyKey, strconv.FormatInt(VotingSupply(), 10),
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
		VotingSupplyKey, strconv.FormatInt(VotingSupply(), 10),
		BalanceKey, strconv.FormatInt(BalanceOf(from), 10),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitVotingSupply(caller std.Address, totalSupply, votingSupply int64, excludedBalance int64) {
	std.Emit(
		"VotingSupply",
		CallerKey, caller.String(),
		TotalSupplyKey, strconv.FormatInt(totalSupply, 10),
		VotingSupplyKey, strconv.FormatInt(votingSupply, 10),
		ExcludedKey, strconv.FormatInt(excludedBalance, 10),
		LaunchpadKey, Launchpad.String(),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}
