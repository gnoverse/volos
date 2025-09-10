import { MarketInfo, Position } from "@/app/types";
import { WAD } from "./format.utils";

// Virtual amounts for share/asset calculations (matching contract values)
const VIRTUAL_SHARES = BigInt("1000000000"); // 1 billion shares
const VIRTUAL_ASSETS = BigInt("1"); // 1 billion base units

/**
 * Converts shares to assets using the same logic as the contract's ToAssetsDown function.
 * This is used to calculate the actual asset amount from stored shares.
 * 
 * @param shares The number of shares to convert
 * @param totalAssets Total assets in the market
 * @param totalShares Total shares in the market
 * @returns The asset amount (rounded down)
 */
export function toAssetsDown(shares: bigint, totalAssets: bigint, totalShares: bigint): bigint {
  const totalSharesWithVirtual = totalShares + VIRTUAL_SHARES;
  const totalAssetsWithVirtual = totalAssets + VIRTUAL_ASSETS;
  
  return (shares * totalAssetsWithVirtual) / totalSharesWithVirtual;
}

/**
 * Converts shares to assets using rounding up, matching contract's ToAssetsUp.
 * (shares * (totalAssets + VIRTUAL_ASSETS) + (totalShares + VIRTUAL_SHARES) - 1) / (totalShares + VIRTUAL_SHARES)
 */
export function toAssetsUp(shares: bigint, totalAssets: bigint, totalShares: bigint): bigint {
  const totalSharesWithVirtual = totalShares + VIRTUAL_SHARES;
  const totalAssetsWithVirtual = totalAssets + VIRTUAL_ASSETS;
  const numerator = shares * totalAssetsWithVirtual + (totalSharesWithVirtual - BigInt("1"));
  return numerator / totalSharesWithVirtual;
}

/**
 * Calculates maxBorrow, healthFactor, and LTV based on user position and market data.
 * This replicates the backend calculation logic from calculateMaxBorrowAndHealthFactor.
 * 
 * @param position User position data
 * @param market Market information
 * @returns Object containing maxBorrow (as BigInt), healthFactor, and LTV (both as numbers)
 */
export function calculatePositionMetrics(position: Position, market: MarketInfo | undefined): {
  maxBorrow: bigint;
  healthFactor: number;
  ltv: number;
} {
  if (!market) {
    return {
      maxBorrow: BigInt(0),
      healthFactor: 0,
      ltv: 0
    };
  }

  const borrowShares = BigInt(position.borrow_shares || "0");
  const collateralAmount = BigInt(position.collateral_supply || "0");
  
  const totalBorrowAssets = BigInt(market.totalBorrowAssets || "0");
  const totalBorrowShares = BigInt(market.totalBorrowShares || "0");
  
  // Calculate actual borrow amount from shares
  const borrowAmount = borrowShares > BigInt(0) && totalBorrowShares > BigInt(0) 
    ? toAssetsDown(borrowShares, totalBorrowAssets, totalBorrowShares)
    : BigInt(0);
  
  const currentPrice = BigInt(market.currentPrice || "0");

  // Parse LLTV - convert percentage to WAD-scaled value
  // market.LLTV is stored as percentage (e.g., 75 for 75%)
  // Convert to WAD: 75% = 0.75 * 1e18 = 750000000000000000000
  const lltvWad = BigInt(market.lltv || "0");  

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
  const maxBorrow = (collateralValue * lltvWad) / WAD; // Divide by WAD

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
    healthFactor = 99999.0;
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
 * subtract 1 from maxBorrow to account for rounding errors
 * 
 * @param position User position data
 * @param market Market information
 * @returns Maximum borrowable amount as BigInt
 */
export function calculateMaxBorrowable(position: Position, market: MarketInfo | undefined): bigint {
  const { maxBorrow } = calculatePositionMetrics(position, market);
  
  if (!market) {
    return BigInt(0);
  }
  
  const borrowShares = BigInt(position.borrow_shares || "0");
  const totalBorrowAssets = BigInt(market.totalBorrowAssets || "0");
  const totalBorrowShares = BigInt(market.totalBorrowShares || "0");
  
  const currentBorrow = borrowShares > BigInt(0) && totalBorrowShares > BigInt(0) 
    ? toAssetsDown(borrowShares, totalBorrowAssets, totalBorrowShares)
    : BigInt(0);
  
  const maxBorrowable = maxBorrow - currentBorrow - BigInt(1); 

  
  return maxBorrowable > BigInt(0) ? maxBorrowable : BigInt(0);
}

/**
 * Calculates the maximum withdrawable amount for a user from their supply shares.
 * This converts the user's supply_shares to assets using toAssetsUp for maximum precision.
 * 
 * @param position User position data
 * @param market Market information
 * @returns Maximum withdrawable amount as BigInt
 */
export function calculateMaxWithdrawable(position: Position, market: MarketInfo | undefined): bigint {
  if (!market) {
    return BigInt(0);
  }
  
  const supplyShares = BigInt(position.supply_shares || "0");
  const totalSupplyAssets = BigInt(market.totalSupplyAssets || "0");
  const totalSupplyShares = BigInt(market.totalSupplyShares || "0");
  
  if (supplyShares === BigInt(0) || totalSupplyShares === BigInt(0)) {
    return BigInt(0);
  }
  
  return toAssetsUp(supplyShares, totalSupplyAssets, totalSupplyShares);
}
