import { MarketInfo, Position } from "@/app/types"
import { calculateMaxBorrowable, calculatePositionMetrics } from "@/app/utils/position.utils"
import { formatUnits } from "viem"

/**
 * Custom hook that provides position calculations and formatted display values
 */
export function usePositionCalculations(positionData: Position, market: MarketInfo) {
  const currentCollateralBI = BigInt(positionData.collateral_supply)
  const currentLoanBI = BigInt(positionData.borrow)
  
  const positionMetrics = calculatePositionMetrics(positionData, market)

  const currentCollateralStr = formatUnits(currentCollateralBI, market.collateralTokenDecimals)
  const currentLoanStr = formatUnits(currentLoanBI, market.loanTokenDecimals)
  const maxBorrowableStr = formatUnits(positionMetrics.maxBorrow, market.loanTokenDecimals)

  return {
    positionMetrics,
    currentCollateralBI,
    currentLoanBI,
    currentCollateralStr,
    currentLoanStr,
    maxBorrowableStr,
    calculateMaxBorrowable: (position: Position) => calculateMaxBorrowable(position, market)
  }
}
