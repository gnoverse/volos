package render

import (
	"std"
	"strings"
	"strconv"

	"gno.land/p/moul/md"
	"gno.land/p/moul/mdtable"
	"gno.land/p/demo/avl/rotree"
	"gno.land/r/sys/users"

	"gno.land/r/volos/gov/xvls"
	"gno.land/r/volos/gov/governance"
	"gno.land/r/volos/gov/staker"
)

func renderUserPageActiveProposals(userAddress std.Address) string {
	userActiveProposals := governance.GetUserActiveProposals(userAddress)

	if len(userActiveProposals) == 0 {
		return ""
	} else {
		out := md.H2("🗳️ Active proposals voted on")
		table := mdtable.Table{
			Headers: []string{"Id", "Title", "Vote", "Reason"},
		}

		for _, userActiveProposal := range userActiveProposals {
			v, found := userActiveProposal.VotingRecord().Readonly().GetVote(userAddress)
			if !found {
				v.Reason = "Error"
			}
			table.Append([]string{
				strconv.Itoa(int(userActiveProposal.ID())),
				userActiveProposal.Definition().Title(),
				string(v.Choice),
				v.Reason,
			})
		}
		out += table.String()
		out += "\n"
		return out
	}
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
		var displayName string
		userData := users.ResolveAddress(std.Address(address))
		if userData != nil && userData.Name() != "" {
			displayName = userData.Name()
		} else {
			displayName = address
		}
		table.Append([]string{
			md.Link(
				displayName,
				"?user=" + address,
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

	var displayName string
	usAddr := std.Address(userParam)
	// TODO mettre pseudo au lieu des address
	userData := users.ResolveAddress(usAddr)
	if userData != nil && userData.Name() != "" {
		displayName = userData.Name()
	} else {
		displayName = usAddr.String()
	}

	out := md.H1("👤 " + displayName)
	balance := xvls.BalanceOf(usAddr)
	if (balance == 0) {
		out += md.Paragraph("🦌 This user has no vote or delegation in any market.")
		return out
	}

	out += md.Paragraph("💰 **Voting Power:** " + strconv.Itoa(int(balance)) + " xVLS")

	out += renderUserPageActiveProposals(usAddr)
	out += renderUserPageDelegations(usAddr)
	return out
}
