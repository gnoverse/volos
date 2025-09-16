package render

import (
	"strconv"
	"strings"
	"time"

	"gno.land/p/moul/md"
	"gno.land/p/nt/commondao"
	"gno.land/r/volos/gov/governance"
)

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

func renderChoices(choices []commondao.VoteChoice) string {
	//TODO: link to vote call tx
	out := ""
	for _, choice := range choices {
		out += string(choice)
		out += " "
	}
	return out
}

func renderTally(proposal *commondao.Proposal) string {

	passes, err := proposal.Definition().Tally(proposal.VotingRecord().ReadonlyVotingRecord, governance.MemberSet())
	if err != nil {
		return err.Error()
	}

	if passes {
		return "proposal passes"
	} else {
		return "proposal dont passes"
	}
}

func renderProposal(proposal *commondao.Proposal) string {
	out := md.H1(proposal.Definition().Title())
	out += md.BulletItem("Proposed by " + md.Link(proposal.Creator().String(), "/r/volos/gov?user="+proposal.Creator().String()) + " at " + proposal.CreatedAt().Format(time.RFC822))
	out += md.Paragraph(md.Blockquote(md.Bold(string(proposal.Status())) + " | deadline: " + md.Bold(proposal.VotingDeadline().Format(time.RFC822)) + " " + proposal.StatusReason()))

	out += md.HorizontalRule()

	out += md.Paragraph(proposal.Definition().Body())
	out += renderChoices(proposal.VoteChoices())

	return out

}

func renderProposalPage(path string) string {
	proposalId := parseProposalParam(path)
	if proposalId == 0 {
		return "Invalid proposal Id"
	}

	proposal := governance.GetProposal(proposalId)
	out := renderProposal(proposal)
	return out
}
