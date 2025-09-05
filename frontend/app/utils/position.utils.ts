import { MarketInfo, Position } from "@/app/types";

/**
 * Calculates maxBorrow, healthFactor, and LTV based on user position and market data.
 * This replicates the backend calculation logic from calculateMaxBorrowAndHealthFactor.
 * 
 * @param position User position data
 * @param market Market information
 * @returns Object containing maxBorrow (as BigInt), healthFactor, and LTV (both as numbers)
 */
export function calculatePositionMetrics(position: Position, market: MarketInfo): {
  maxBorrow: bigint;
  healthFactor: number;
  ltv: number;
} {
  const borrowAmount = BigInt(position.borrow);
  const collateralAmount = BigInt(position.collateral_supply);
  
  const currentPrice = BigInt(market.currentPrice || "0");

  // Parse LLTV - convert percentage to WAD-scaled value
  // market.LLTV is stored as percentage (e.g., 75 for 75%)
  // Convert to WAD: 75% = 0.75 * 1e18 = 750000000000000000000
  const lltvPercentage = market.lltv;
  const lltvWad = BigInt(Math.floor(lltvPercentage * 1e16)); // Convert percentage to WAD

  // If no collateral, return zero values
  if (collateralAmount === BigInt(0)) {
    return {
      maxBorrow: BigInt(0),
      healthFactor: 0,
      ltv: 0
    };
  }

  // Calculate collateral value in loan token terms
  // collateralValue = (collateralAmount * currentPrice) / ORACLE_PRICE_SCALE
  const oraclePriceScale = BigInt(10) ** BigInt(36); // 1e36
  const collateralValue = (collateralAmount * currentPrice) / oraclePriceScale;

  // Calculate maxBorrow = collateralValue * LLTV
  const maxBorrow = (collateralValue * lltvWad) / (BigInt(10) ** BigInt(18)); // Divide by WAD

  // Calculate LTV (Loan-to-Value) as percentage
  // LTV = (borrowAmount / collateralValue) * 100
  let ltv = 0;
  if (collateralValue > BigInt(0)) {
    // Convert to numbers for division, then back to percentage
    const borrowFloat = Number(borrowAmount);
    const collateralFloat = Number(collateralValue);
    ltv = (borrowFloat / collateralFloat) * 100;
  }

  // Calculate healthFactor
  // healthFactor = maxBorrow / loanAmount (if loanAmount > 0)
  let healthFactor = 0;
  if (borrowAmount > BigInt(0)) {
    const maxBorrowFloat = Number(maxBorrow);
    const borrowAmountFloat = Number(borrowAmount);
    healthFactor = maxBorrowFloat / borrowAmountFloat;
  } else {
    // If no loan, healthFactor is infinite (represented as a large number)
    healthFactor = 999999.0;
  }

  return {
    maxBorrow,
    healthFactor,
    ltv
  };
}

/**
 * Calculates the maximum borrowable amount for a user.
 * This is maxBorrow minus current borrow amount.
 * 
 * @param position User position data
 * @param market Market information
 * @returns Maximum borrowable amount as BigInt
 */
export function calculateMaxBorrowable(position: Position, market: MarketInfo): bigint {
  const { maxBorrow } = calculatePositionMetrics(position, market);
  const currentBorrow = BigInt(position.borrow);
  
  const maxBorrowable = maxBorrow - currentBorrow;
  
  return maxBorrowable > BigInt(0) ? maxBorrowable : BigInt(0);
}
