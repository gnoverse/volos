import { getTokenBalance } from "@/app/services/abci"
import { Market } from "@/app/types"
import { toastError } from "@/components/ui/toast"
import { useCallback, useEffect, useState } from "react"

/**
 * Custom hook that calculates the actual maximum repayable amount for a user.
 * 
 * This hook considers two constraints:
 * 1. Current borrow assets (user can't repay more than they owe)
 * 2. User's loan token balance (user can't repay more than they have)
 * 
 * The final result is the minimum of these two values.
 * 
 * @param position User position data
 * @param market Market information
 * @param userAddress User's wallet address
 * @returns Object containing maxRepayable amount and loading state
 */
export function useMaxRepayable(
  expectedBorrowAssets: string,
  market: Market,
  userAddress: string | undefined
) {
  const [maxRepayable, setMaxRepayable] = useState<bigint>(BigInt(0))
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const calculateMaxRepayableAmount = useCallback(async () => {
    if (!userAddress) {
      setMaxRepayable(BigInt(0))
      return
    }

    setIsLoading(true)
    
    try {
      // 1. Current borrow assets (what user owes)
      const borrowAmount = BigInt(expectedBorrowAssets) - BigInt(1)

      // 2. Get user's loan token balance
      const userBalance = await getTokenBalance(market.loan_token, userAddress)
      const userBalanceBigInt = BigInt(userBalance)

      // Take the minimum of the two constraints
      const actualMaxRepayable = borrowAmount < userBalanceBigInt ? borrowAmount : userBalanceBigInt

      setMaxRepayable(actualMaxRepayable)
    } catch (err) {
      toastError("Failed to calculate max repayable:", String(err))
      setMaxRepayable(BigInt(0))
    } finally {
      setIsLoading(false)
    }
  }, [expectedBorrowAssets, market.loan_token, userAddress])

  useEffect(() => {
    calculateMaxRepayableAmount()
  }, [calculateMaxRepayableAmount])

  return {
    maxRepayable,
    isLoading,
    refetch: calculateMaxRepayableAmount
  }
}
