import { Market, Position } from "@/app/types"
import { calculatePositionMetrics, toAssetsUp } from "@/app/utils/position.utils"

/**
 * Custom hook that provides position calculations and formatted display values
 */
export function usePositionCalculations(positionData: Position, market: Market, expectedBorrowAssetsString: string) {
  const currentCollateral = BigInt(positionData.collateral_supply || "0")
  const currentBorrowSharesBI = BigInt(positionData.borrow_shares || "0")

  const positionMetrics = calculatePositionMetrics(positionData, market, expectedBorrowAssetsString)

  let currentBorrowAssets: bigint
  if (expectedBorrowAssetsString) {
    currentBorrowAssets = BigInt(expectedBorrowAssetsString)
  }else{
    currentBorrowAssets = currentBorrowSharesBI > BigInt(0) && market.total_borrow_shares && market.total_borrow
    ? toAssetsUp(
        currentBorrowSharesBI,
        BigInt(market.total_borrow),
        BigInt(market.total_borrow_shares)
        )
      : BigInt(0)
  }

  return {
    positionMetrics,
    currentCollateral,
    currentBorrowAssets,
  }
} 
