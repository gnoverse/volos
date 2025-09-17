package governance

import (
	"strconv"
	"strings"
	"time"

	"gno.land/p/demo/avl"
	"gno.land/p/demo/avl/pager"
	"gno.land/p/demo/seqid"
	"gno.land/p/moul/md"
	"gno.land/p/moul/txlink"
	"gno.land/p/nt/commondao"
	"gno.land/r/sys/users"
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
		out += md.BulletItem(md.Link(proposal.Definition().Title(), "/r/volos/gov/governance?proposal="+item.Key))
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
	if strings.HasPrefix(path, "?proposal=") {
		return renderProposalPage(path)
	}

	out := md.H1("🏛️ Volos Governance")
	out += md.Paragraph("On-chain governance for the Volos protocol")
	out += md.H2("🪧 Make a proposal")
	out += md.Blockquote(md.Link("Propose a specific governance improvement for Volos", txlink.Call("CreateProposal")) + " (e.g., voting rules, treasury management, member roles).")

	out += listActiveProposals(path)
	return out
}

func parseProposalParam(path string) uint64 {
	proposalParam := strings.TrimPrefix(path, "?proposal=")
	proposalParam = strings.SplitN(proposalParam, "&", 2)[0]
	if proposalParam == "" {
		return 0
	}
	proposalId, err := strconv.Atoi(proposalParam)
	if err != nil {
		return 0
	}
	return uint64(proposalId)
}

func renderChoices(choices []commondao.VoteChoice, eachVoteCount []int, proposal *commondao.Proposal) string {
	out := "| "
	for i, choice := range choices {
		out += md.Link(string(choice), txlink.Call("Vote", "proposalID", strconv.Itoa(int(proposal.ID())), "choice", string(choice))) + ": " + strconv.Itoa(eachVoteCount[i]) + " | "
	}
	out += "\n\n"
	return out
}

func renderStats(proposal *commondao.Proposal) string {

	totalVoteCount := strconv.Itoa(proposal.VotingRecord().ReadonlyVotingRecord.Size())

	eachVoteCount := make([]int, len(proposal.VoteChoices()))
	for i, voteChoice := range proposal.VoteChoices() {
		eachVoteCount[i] = proposal.VotingRecord().ReadonlyVotingRecord.VoteCount(voteChoice)
	}
	mostVotedChoice := commondao.FindMostVotedChoice(proposal.VotingRecord().ReadonlyVotingRecord)

	out := "📊 Total vote count: " + totalVoteCount + " | "
	out += md.Paragraph(md.Bold(string(mostVotedChoice)) + " is the most popular 🔥")
	out += renderChoices(proposal.VoteChoices(), eachVoteCount, proposal)
	return out
}

func fillVoteRecordTree(votingRecord commondao.ReadonlyVotingRecord) *avl.Tree {
	tree := avl.NewTree()

	noReverse := false
	votingRecord.Iterate(0, votingRecord.Size(), noReverse, func(vote commondao.Vote) bool {
		tree.Set(vote.Address.String(), vote)
		return false
	})

	return tree
}

func renderVotes(path string, votingRecord commondao.ReadonlyVotingRecord) string {
	readonlyVotingRecordTree := fillVoteRecordTree(votingRecord)

	p := pager.NewPager(readonlyVotingRecordTree, 10, false)
	page := p.MustGetPageByPath(path)

	var out string
	for _, item := range page.Items {
		vote := item.Value.(commondao.Vote)
		var displayName string
		userData := users.ResolveAddress(vote.Address)
		if userData != nil && userData.Name() != "" {
			displayName = userData.Name()
		} else {
			displayName = vote.Address.String()
		}
		out += md.BulletItem(md.Link(displayName, "/r/volos/gov?user="+item.Key) + " voted " + md.Bold(string(vote.Choice)) + " because " + md.Bold(vote.Reason))
	}

	out += "\nPage " + strconv.Itoa(page.PageNumber) + " of " + strconv.Itoa(page.TotalPages) + "\n\n"
	out += page.Picker(path)
	return out
}

func renderProposal(path string, proposal *commondao.Proposal) string {
	out := md.H1(proposal.Definition().Title())
	out += md.BulletItem("Proposed by " + md.Link(proposal.Creator().String(), "/r/volos/gov?user="+proposal.Creator().String()) + " at " + proposal.CreatedAt().Format(time.RFC822))

	passes, err := proposal.Definition().Tally(proposal.VotingRecord().ReadonlyVotingRecord, MemberSet())
	if err != nil {
		return err.Error()
	}

	out += md.Blockquote(md.Bold(string(proposal.Status())) + " | deadline: " + md.Bold(proposal.VotingDeadline().Format(time.RFC822)) + " " + proposal.StatusReason())

	if passes {
		out += md.Paragraph("| Will be adopted ✅")
	} else {
		out += md.Paragraph("| Will be aborted ❌")
	}

	out += md.HorizontalRule()

	out += md.Paragraph(proposal.Definition().Body())
	out += md.HorizontalRule()
	out += renderStats(proposal)
	out += renderVotes(path, proposal.VotingRecord().ReadonlyVotingRecord)

	return out

}

func renderProposalPage(path string) string {
	proposalId := parseProposalParam(path)
	if proposalId == 0 {
		return "Invalid proposal Id"
	}

	proposal := GetProposal(proposalId)
	return renderProposal(path, proposal)
}
