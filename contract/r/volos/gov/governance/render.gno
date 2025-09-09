package governance

import (
	"strconv"

	"gno.land/p/nt/commondao"
)

func ListActiveProposals() string {
	out := strconv.Itoa(volosGovernance.ActiveProposals().Size()) + "\n\n"

	volosGovernance.ActiveProposals().Iterate(
		0,
		volosGovernance.ActiveProposals().Size(),
		false,
		func(proposal *commondao.Proposal) bool {
			out += strconv.Itoa(int(proposal.ID())) + "\n"
			out += proposal.Definition().Title() + "\n\n"
			return false
		},
	)
	return out
}

func Render(_ string) string {
	out := ListActiveProposals()
	return out + "Volos Governance - On-chain governance for the Volos protocol"
}
