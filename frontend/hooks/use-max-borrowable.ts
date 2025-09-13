import { Market, Position } from "@/app/types"
import { calculateMaxBorrowable } from "@/app/utils/position.utils"
import { getExpectedBorrowAssets } from "@/app/services/abci"
import { useCallback, useEffect, useState } from "react"

/**
 * Custom hook that calculates the actual maximum borrowable amount for a user.
 * 
 * This hook considers three constraints:
 * 1. Position-based max borrow (maxBorrow - currentBorrow)
 * 2. Market liquidity (total_supply - total_borrow)
 * 
 * The final result is the minimum of these three values.
 * 
 * @param position User position data
 * @param market Market information
 * @param userAddress User's wallet address
 * @returns Object containing maxBorrowable amount and loading state
 */
export function useMaxBorrowable(
  position: Position,
  market: Market,
  userAddress: string | undefined
) {
  const [maxBorrowable, setMaxBorrowable] = useState<bigint>(BigInt(0))
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const calculateMaxBorrowableAmount = useCallback(async () => {
    if (!userAddress) {
      setMaxBorrowable(BigInt(0))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const currentBorrowAssets = BigInt(await getExpectedBorrowAssets(market.id, userAddress))
      const positionBasedMax = calculateMaxBorrowable(position, market, currentBorrowAssets)

      const marketLiquidity = BigInt(market.total_supply) - BigInt(market.total_borrow)

      const actualMaxBorrowable = [positionBasedMax, marketLiquidity]
        .reduce((min, current) => current < min ? current : min)

      setMaxBorrowable(actualMaxBorrowable)
    } catch (err) {
      console.error("Failed to calculate max borrowable:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
      setMaxBorrowable(BigInt(0))
    } finally {
      setIsLoading(false)
    }
  }, [position, market, userAddress])

  useEffect(() => {
    calculateMaxBorrowableAmount()
  }, [calculateMaxBorrowableAmount])

  return {
    maxBorrowable,
    isLoading,
    error,
    refetch: calculateMaxBorrowableAmount
  }
}
