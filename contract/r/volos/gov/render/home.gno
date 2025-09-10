package render

import (
	"gno.land/p/moul/md"
)

func renderHome(path string) string {
	out := md.H1("Volos Governance 🦌")
	out += md.Paragraph("Participate in the decentralized governance of the Volos protocol. As a stakeholder, you can propose changes, vote on proposals, and help shape the future of the lending ecosystem on gno.land.")
	out += md.H2("🗳️ Governance Features")
	out += md.Paragraph("• **Propose**: Submit governance proposals to modify protocol parameters")
	out += md.Paragraph("• **Vote**: Cast your vote on active proposals using your staked tokens")
	out += md.Paragraph("• **Delegate**: Delegate your voting power to trusted community members")
	out += md.Paragraph("• **Execute**: Implement approved proposals automatically on-chain")
	out += md.H2("👤 Your Governance Status")
	out += md.Blockquote("To view your voting power and governance participation, navigate to `?user=g1xxx` e.g. `?user=g1jg8mtutu9khhfwc4nxmuhcpftf0pajdhfvsqf5`")
	out += md.H2("🚀 Get Voting Power")
	out += md.Paragraph("Need voting power to participate in governance? " + md.Link("Stake your tokens", "/r/volos/staker") + " to earn voting power and contribute to protocol decisions.")
	out += md.H2("📊 Active Proposals")
	out += md.Paragraph("View and participate in current governance proposals affecting the protocol.")
	return out
}
