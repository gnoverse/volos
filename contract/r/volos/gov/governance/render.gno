package governance

import (
	"strconv"

	"gno.land/p/nt/commondao"
	"gno.land/p/moul/md"
	"gno.land/p/moul/mdtable"
	"gno.land/p/nt/avl/pager"
)

// TODO: avl tree + pager
func listActiveProposals() string {
	out := md.H2("🗳️ Active Proposals")

	out += activeProposalsCount()

	p := pager.NewPager(20, true)
	volosGovernance.ActiveProposals().Iterate(
		0,
		volosGovernance.ActiveProposals().Size(),
		false,
		func(proposal *commondao.Proposal) bool {
			choices := ""
			for _, choice := range proposal.VoteChoices() {
				choices += string(choice) + ", "
			}
			choices = choices[:len(choices)-2]

			table.Append([]string{
				strconv.Itoa(int(proposal.ID())),
				proposal.Definition().Title(),
				strconv.Itoa(int(proposal.VotingRecord().Readonly().Size())),
				choices,
				proposal.VotingDeadline().String()[:19],
			})
			return false
		},
	)
	out += table.String()
	out += "\n"
	return out
}

func activeProposalsCount() string {
	count := volosGovernance.ActiveProposals().Size()
	out := md.Paragraph("💰 **Active Proposals:** " + strconv.Itoa(count))
	return out
}

func Render(_ string) string {
	out := md.H1("🏛️ Volos Governance")
	out += md.Paragraph("On-chain governance for the Volos protocol")

	out += listActiveProposals()
	return out
}
