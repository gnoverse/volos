package staker

import (
	"strconv"

	"gno.land/p/demo/avl"
	"gno.land/p/demo/avl/pager"
	"gno.land/p/moul/md"
	"gno.land/p/moul/mdtable"
	"gno.land/r/volos/render"
)

func Render(path string) string {
	out := md.H1("⚡ Volos Staker")
	out += md.Paragraph("A staking mechanism for VLS tokens that allows users to delegate their tokens and participate in governance. Stakers can earn rewards while contributing to network security.")
	out += md.HorizontalRule()

	out += md.H2("🚦 Status")
	unstackLockPeriodInHours := int(UnstakeLockPeriod()) / 60 / 60
	out += md.Columns([]string{
		md.H3("Total staked 💰") + renderTotalStaked(),
		md.H3("Unstake pending 💸") + renderTotalPending(),
		md.H3("Unstake cooldown ⏳") + md.Blockquote(strconv.Itoa(unstackLockPeriodInHours)+" hours"),
	}, false)

	out += md.HorizontalRule()

	out += md.H2("🚀 Top Stakers")
	out += renderTopDelegators(path)
	out += md.H2("🔄 Pending Unstake")
	out += renderPendingUnstake(path)
	return out
}

func renderTotalStaked() string {
	totalStaked := int64(0)

	delegations.IterateByOffset(0, delegations.Size(), func(_ string, value any) bool {
		delegatee := value.(*avl.Tree)
		delegatee.IterateByOffset(0, delegatee.Size(), func(_ string, vvalue any) bool {
			amount := vvalue.(int64)
			totalStaked += amount
			return false
		})
		return false
	})

	return md.Blockquote(strconv.FormatInt(totalStaked, 10) + " VLS")
}

func renderTopDelegators(path string) string {
	type stakerInfo struct {
		address string
		amount  int64
	}

	var stakers []stakerInfo

	delegations.IterateByOffset(0, delegations.Size(), func(DelegatorAddress string, value any) bool {
		delegatee := value.(*avl.Tree)
		delegatee.IterateByOffset(0, delegatee.Size(), func(DelegateeAddress string, value any) bool {
			amount := value.(int64)
			stakers = append(stakers, stakerInfo{
				address: DelegateeAddress,
				amount:  amount,
			})
			return false
		})
		return false
	})

	for i := 0; i < len(stakers)-1; i++ {
		for j := i + 1; j < len(stakers); j++ {
			if stakers[j].amount > stakers[i].amount {
				stakers[i], stakers[j] = stakers[j], stakers[i]
			}
		}
	}

	if len(stakers) > 10 {
		stakers = stakers[:10]
	}

	table := mdtable.Table{
		Headers: []string{"Address", "Amount"},
	}

	for _, staker := range stakers {
		displayName := render.ResolveDisplayName(staker.address)
		table.Append([]string{md.Link(displayName, "/r/volos/gov?user="+staker.address), strconv.FormatInt(staker.amount, 10) + " VLS"})
	}

	return table.String() + "\n\n"
}

func renderTotalPending() string {
	totalPending := int64(0)

	pendingUnstakes.IterateByOffset(0, pendingUnstakes.Size(), func(_ string, value any) bool {
		unstakeInfos := value.([]UnstakeInfo)
		for _, unstakeInfo := range unstakeInfos {
			totalPending += unstakeInfo.Amount
		}
		return false
	})
	out := md.Blockquote(strconv.Itoa(int(totalPending)) + " VLS")
	return out
}

func renderPendingUnstake(path string) string {
	if pendingUnstakes.Size() == 0 {
		return "No unstake pending."
	}
	noReverse := false
	p := pager.NewPager(pendingUnstakes, 10, noReverse)
	page := p.MustGetPageByPath(path)

	out := page.Picker(path) + "\n\n"

	for _, item := range page.Items {
		pending := item.Value.([]UnstakeInfo)

		displayName := render.ResolveDisplayName(item.Key)
		for _, info := range pending {
			out += md.BulletItem(md.Link(displayName, "/r/volos/gov/?user="+item.Key))
			out += info.Delegatee.String()
		}
	}

	out += "\nPage " + strconv.Itoa(page.PageNumber) + " of " + strconv.Itoa(page.TotalPages) + "\n\n"
	out += page.Picker(path)
	return out
}
