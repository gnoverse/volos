package governance

import (
	"strconv"

	"gno.land/p/demo/avl"
	"gno.land/p/demo/avl/pager"
	"gno.land/p/demo/seqid"
	"gno.land/p/moul/md"
	"gno.land/p/moul/txlink"
	"gno.land/p/nt/commondao"
)

func fillProposalTree(activeProposal commondao.ProposalStorage) *avl.Tree {
	proposalTree := avl.NewTree()

	volosGovernance.ActiveProposals().Iterate(
		0,
		volosGovernance.ActiveProposals().Size(),
		false,
		func(proposal *commondao.Proposal) bool {
			proposalTree.Set(seqid.ID(proposal.ID()).String(), proposal)
			return false
		},
	)
	return proposalTree
}

func listActiveProposals(path string) string {
	p := pager.NewPager(fillProposalTree(volosGovernance.ActiveProposals()), 10, false)
	page := p.MustGetPageByPath(path)

	out := md.H2("🗳️ Active Proposals")
	out += activeProposalsCount()
	out += page.Picker(path) + "\n\n"

	for _, item := range page.Items {
		proposal := item.Value.(*commondao.Proposal)
		out += md.BulletItem(md.Link(proposal.Definition().Title(), "/r/volos/gov?proposal="+item.Key))
	}

	out += "\nPage " + strconv.Itoa(page.PageNumber) + " of " + strconv.Itoa(page.TotalPages) + "\n\n"
	out += page.Picker(path)

	return out
}

func activeProposalsCount() string {
	count := volosGovernance.ActiveProposals().Size()
	out := md.Paragraph("📊 **Total:** " + strconv.Itoa(count))
	return out
}

func Render(path string) string {
	out := md.H1("🏛️ Volos Governance")
	out += md.Paragraph("On-chain governance for the Volos protocol")
	out += md.H2("🪧 Make a proposal")
	out += md.Blockquote(md.Link("Propose a specific governance improvement for Volos", txlink.Call("CreateProposal")) + " (e.g., voting rules, treasury management, member roles).")

	out += listActiveProposals(path)
	return out
}
