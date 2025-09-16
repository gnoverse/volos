import { Market, Position } from "@/app/types"
import { calculateMaxBorrowable } from "@/app/utils/position.utils"
import { toastError } from "@/components/ui/toast"
import { useCallback, useEffect, useState } from "react"

/**
 * Custom hook that calculates the actual maximum borrowable amount for a user.
 * 
 * This hook considers 2 constraints:
 * 1. Position-based max borrow (maxBorrow - currentBorrow (interested accrued))
 * 2. Market liquidity (total_supply - total_borrow)
 * 
 * The final result is the minimum of these 2 values.
 * 
 * @param position User position data
 * @param market Market information
 * @param userAddress User's wallet address
 * @param expectedBorrowAssets Expected borrow assets
 * @returns Object containing maxBorrowable amount and loading state
 */
export function useMaxBorrowable(
  position: Position,
  market: Market,
  userAddress: string | undefined,
  expectedBorrowAssets: string
) {
  const [maxBorrowable, setMaxBorrowable] = useState<bigint>(BigInt(0))
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const calculateMaxBorrowableAmount = useCallback(async () => {
    if (!userAddress || !expectedBorrowAssets) {
      setMaxBorrowable(BigInt(0))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const positionBasedMax = calculateMaxBorrowable(position, market, expectedBorrowAssets)

      const marketLiquidity = BigInt(market.total_supply) - BigInt(market.total_borrow)

      const actualMaxBorrowable = [positionBasedMax, marketLiquidity]
        .reduce((min, current) => current < min ? current : min)

      setMaxBorrowable(actualMaxBorrowable)
    } catch (error) {
      toastError("Error calculating max borrowable", String(error))
      setMaxBorrowable(BigInt(0))
    } finally {
      setIsLoading(false)
    }
  }, [position, market, userAddress, expectedBorrowAssets])

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
