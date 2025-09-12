import { getTokenBalance } from "@/app/services/abci"
import { Market, Position } from "@/app/types"
import { usePositionCalculations } from "@/hooks/use-position-calculations"
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
  position: Position,
  market: Market,
  userAddress: string | undefined
) {
  const [maxRepayable, setMaxRepayable] = useState<bigint>(BigInt(0))
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const {
    currentBorrowAssets,
  } = usePositionCalculations(position, market)

  const calculateMaxRepayableAmount = useCallback(async () => {
    if (!userAddress) {
      setMaxRepayable(BigInt(0))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 1. Current borrow assets (what user owes)
      const borrowAmount = currentBorrowAssets

      // 2. Get user's loan token balance
      const userBalance = await getTokenBalance(market.loan_token, userAddress)
      const userBalanceBigInt = BigInt(userBalance)

      // Take the minimum of the two constraints
      const actualMaxRepayable = borrowAmount < userBalanceBigInt ? borrowAmount : userBalanceBigInt

      setMaxRepayable(actualMaxRepayable)
    } catch (err) {
      console.error("Failed to calculate max repayable:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
      setMaxRepayable(BigInt(0))
    } finally {
      setIsLoading(false)
    }
  }, [currentBorrowAssets, market.loan_token, userAddress])

  useEffect(() => {
    calculateMaxRepayableAmount()
  }, [calculateMaxRepayableAmount])

  return {
    maxRepayable,
    isLoading,
    error,
    refetch: calculateMaxRepayableAmount
  }
}
