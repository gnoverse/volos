import { Market, Position } from "@/app/types"
import { calculatePositionMetrics, toAssetsUp } from "@/app/utils/position.utils"

/**
 * Custom hook that provides position calculations and formatted display values
 */
export function usePositionCalculations(positionData: Position, market: Market) {
  const currentCollateral = BigInt(positionData.collateral_supply || "0")
  const currentBorrowSharesBI = BigInt(positionData.borrow_shares || "0")

  const positionMetrics = calculatePositionMetrics(positionData, market)

  const currentBorrowAssets = currentBorrowSharesBI > BigInt(0) && market.total_borrow_shares && market.total_borrow
    ? toAssetsUp(
        currentBorrowSharesBI,
        BigInt(market.total_borrow),
        BigInt(market.total_borrow_shares)
      )
    : BigInt(0)

  const healthFactor = positionMetrics.healthFactor

  return {
    positionMetrics,
    currentCollateral,
    currentBorrowAssets,
    healthFactor,
  }
}
