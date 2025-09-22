package mocks

import (
	"std"
	"time"

	"gno.land/r/volos/core"
	"gno.land/r/volos/gov/governance"
	"gno.land/r/volos/gov/staker"
	"gno.land/r/volos/gov/vls"
)

// callback function that will be executed if the proposal passes
// This sets the fee to 25%
func setFeeCallback() {
	core.SetFee(cross, "gno.land/r/demo/wugnot:gno.land/r/gnoswap/v1/gns:3000:0", 25)
}

func setProposalThresholdCallback() {
	governance.SetProposalThreshold(50000)
}

func setVotingPowerQuorumCallback() {
	governance.SetVotingPowerQuorum(500)
}

func CreateProposals(cur realm) {
	vls.Faucet(cross, 100000000)
	vls.Approve(cross, std.DerivePkgAddr("gno.land/r/volos/gov/staker"), 100000000)
	staker.Stake(cross, 100000, std.DerivePkgAddr("gno.land/r/volos/mocks"))

	governance.CreateProposal(
		cross,
		"Set GNS/WUGNOT Market Fee to 25%",
		"This proposal seeks to establish a 25% fee structure for the GNS/WUGNOT lending market to optimize protocol revenue and ensure sustainable growth.",
		time.Duration(1*time.Minute),
		setFeeCallback,
	)

	governance.CreateProposal(
		cross,
		"Set Proposal Creation Threshold to 50000 xVLS",
		"This proposal seeks to establish a proposal creation threshold of 50000 xVLS tokens to ensure that only serious and well-resourced community members can submit governance proposals, maintaining proposal quality and preventing spam.",
		time.Duration(1*time.Hour),
		setProposalThresholdCallback,
	)

	governance.CreateProposal(
		cross,
		"Decrease Voting Power Quorum to 500",
		"This proposal seeks to reduce the voting power quorum to 500 xVLS tokens to improve governance accessibility and encourage broader community participation in the Volos protocol.",
		time.Duration(5*time.Hour),
		setVotingPowerQuorumCallback,
	)
}
