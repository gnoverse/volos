package render

import (
	"gno.land/p/moul/md"
)

func renderHome(path string) string {
	out := md.H1("Volos Governance 🦌")
	out += md.Paragraph("Volos Governance is the system through which the community shapes the protocol’s future. It enables members to create proposals, vote on key decisions, and collectively guide upgrades, parameters, and strategic direction. Features include adjustable quorum requirements for flexibility and a fair voting process that ensures decisions reflect the will of active participants.")
	out += md.H2("👤 Your Governance Status")
	out += md.Blockquote("To view your voting power and governance participation, navigate to `?user=g1xxx` e.g. `?user=g1jg8mtutu9khhfwc4nxmuhcpftf0pajdhfvsqf5`")
	out += md.H2("🚀 Get Voting Power")
	out += md.Paragraph("Need voting power to participate in governance? " + md.Link("Stake your tokens", "/r/volos/gov/staker") + " to earn voting power and contribute to protocol decisions.")
	out += md.H2("📊 Active Proposals")
	out += md.Paragraph("View and participate in current " + md.Link("governance proposals", "/r/volos/gov/governance") + " affecting the protocol.")
	return out
}
