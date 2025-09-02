package staker

import (
	"strconv"

	"gno.land/p/demo/avl"
	"gno.land/p/moul/md"
	"gno.land/p/moul/mdtable"
)

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

	return md.Paragraph("Total staked: " + strconv.FormatInt(totalStaked, 10) + " VLS")
}

func renderTopDelegators() string {
	table := mdtable.Table{
		Headers: []string{"Address", "Amount"},
	}

	//TODO: Implement sorting by amount
	delegations.IterateByOffset(0, delegations.Size(), func(_ string, value any) bool {
		delegatee := value.(*avl.Tree)
		delegatee.IterateByOffset(0, delegatee.Size(), func(address string, vvalue any) bool {
			amount := vvalue.(int64)
			table.Append([]string{address, strconv.FormatInt(amount, 10) + " VLS"})
			return false
		})
		return false
	})

	return table.String()
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
	out := md.Paragraph("Total unstake pending: " + strconv.Itoa(int(totalPending)) + " VLS")
	return out
}

func Render(_ string) string {
	out := md.H1("Volos staker")

	unstackLockPeriodInHours := int(UnstakeLockPeriod()) / 60 / 60
	out += md.Blockquote("Unstake lock cooldown: " + strconv.Itoa(unstackLockPeriodInHours) + " hours")

	out += md.H2("Status")
	out += renderTotalStaked()
	out += renderTotalPending()
	out += md.H2("Top Stakers")
	out += renderTopDelegators()
	return out
}
