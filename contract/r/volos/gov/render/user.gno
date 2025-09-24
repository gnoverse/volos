package render

import (
	"std"
	"strconv"
	"strings"

	"gno.land/p/demo/avl"
	"gno.land/p/demo/avl/pager"
	"gno.land/p/demo/avl/rotree"
	"gno.land/p/demo/seqid"
	"gno.land/p/moul/md"
	"gno.land/p/moul/mdtable"
	"gno.land/p/nt/commondao"

	"gno.land/r/volos/gov/governance"
	"gno.land/r/volos/gov/staker"
	"gno.land/r/volos/gov/xvls"
	"gno.land/r/volos/render"
)

func fillProposalTree(userActiveProposals []*commondao.Proposal) *avl.Tree {
	proposalTree := avl.NewTree()

	for _, userActiveProposal := range userActiveProposals {
		proposalTree.Set(seqid.ID(userActiveProposal.ID()).String(), userActiveProposal)
	}
	return proposalTree
}

func renderUserPageActiveProposals(path string, userAddress std.Address) string {
	userActiveProposals := governance.GetUserActiveProposals(userAddress)
	if len(userActiveProposals) == 0 {
		return ""
	}

	p := pager.NewPager(fillProposalTree(userActiveProposals), 10, false)
	page := p.MustGetPageByPath(path)

	out := md.H2("🗳️ Active proposals voted on")

	out += page.Picker(path) + "\n\n"
	for _, item := range page.Items {
		proposal := item.Value.(*commondao.Proposal)
		vote, _ := proposal.VotingRecord().Readonly().GetVote(userAddress)
		out += md.BulletItem(md.Link(proposal.Definition().Title(), "/r/volos/gov/governance?proposal="+item.Key) + " voted " + md.Bold(string(vote.Choice)) + " because " + vote.Reason)
	}

	out += "\nPage " + strconv.Itoa(page.PageNumber) + " of " + strconv.Itoa(page.TotalPages) + "\n\n"
	out += page.Picker(path)
	return out
}

func parseUserParam(path string) string {
	userParam := strings.TrimPrefix(path, "?user=")
	userParam = strings.SplitN(userParam, "&", 2)[0]
	if userParam == "" {
		return md.Paragraph("No user address provided.")
	}
	return userParam
}

func renderUserPageDelegations(userAddress std.Address) string {
	delegations := staker.Delegations()
	userDelegationsAny, exists := delegations.Get(userAddress.String())
	if !exists {
		return ""
	}
	out := md.H2("🔐 $xVLS Delegated")

	userDelegations := userDelegationsAny.(*rotree.ReadOnlyTree)

	table := mdtable.Table{
		Headers: []string{"Delegatee", "Amount"},
	}

	userDelegations.IterateByOffset(0, userDelegations.Size(), func(address string, value any) bool {
		amount := value.(int64)
		displayName := render.ResolveDisplayName(address)
		table.Append([]string{
			md.Link(
				displayName,
				"?user="+address,
			),
			strconv.FormatInt(amount, 10),
		})
		return false
	})
	out += table.String()
	return out
}

func renderUserPage(path string) string {
	userParam := parseUserParam(path)

	usAddr := std.Address(userParam)
	displayName := render.ResolveDisplayName(userParam)

	out := md.H1("👤 " + displayName)
	balance := xvls.BalanceOf(usAddr)
	if balance == 0 {
		out += md.Paragraph("🦌 This user has no vote or delegation in any market.")
		return out
	}

	out += md.Paragraph("💰 **Voting Power:** " + strconv.Itoa(int(balance)) + " xVLS")

	out += renderUserPageDelegations(usAddr)
	out += renderUserPageActiveProposals(path, usAddr)
	return out
}
