import { MarketInfo, Position } from "@/app/types"
import { calculateMaxBorrowable, calculatePositionMetrics, toAssetsUp } from "@/app/utils/position.utils"

/**
 * Custom hook that provides position calculations and formatted display values
 */
export function usePositionCalculations(positionData: Position, market: MarketInfo) {
  const currentCollateral = BigInt(positionData.collateral_supply || "0")
  const currentBorrowSharesBI = BigInt(positionData.borrow_shares || "0")

  const positionMetrics = calculatePositionMetrics(positionData, market)

  const currentBorrowAssets = currentBorrowSharesBI > BigInt(0) && market.totalBorrowShares && market.totalBorrowAssets
    ? toAssetsUp(
        currentBorrowSharesBI,
        BigInt(market.totalBorrowAssets),
        BigInt(market.totalBorrowShares)
      )
    : BigInt(0)

  const healthFactor = positionMetrics.healthFactor
  const maxBorrow = positionMetrics.maxBorrow

  return {
    positionMetrics,
    currentCollateral,
    currentBorrowAssets,
    maxBorrow,
    healthFactor,
    calculateMaxBorrowable: (position: Position) => calculateMaxBorrowable(position, market)
  }
}
