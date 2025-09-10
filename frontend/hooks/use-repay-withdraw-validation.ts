import { Market } from "@/app/types"
import { parseUnits } from "viem"

/**
 * Custom hook that provides form validation logic for repay and withdraw inputs
 */
export function useRepayWithdrawValidation(
  repayAmount: string,
  withdrawAmount: string,
  market: Market,
  currentBorrowAssets: bigint,
  currentCollateral: bigint
) {
  const hasTooManyDecimals = (input: string, maxDecimals: number): boolean => {
    if (!input || input === "0") return false
    const decimalIndex = input.indexOf('.')
    if (decimalIndex === -1) return false
    const decimalPart = input.substring(decimalIndex + 1)
    return decimalPart.length > maxDecimals
  }

  const repayAmountBI = parseUnits(repayAmount || "0", market.loan_token_decimals)
  const withdrawAmountBI = parseUnits(withdrawAmount || "0", market.collateral_token_decimals)

  const isRepayInputEmpty = !repayAmount || repayAmount === "0"
  const isRepayTooManyDecimals = hasTooManyDecimals(repayAmount, market.loan_token_decimals)
  const isRepayOverMax = repayAmountBI > currentBorrowAssets
  const repayButtonMessage = isRepayInputEmpty 
    ? "Enter repay amount" 
    : isRepayTooManyDecimals
      ? "Too many decimals"
      : isRepayOverMax 
        ? "Exceeds loan amount" 
        : "Repay"

  const isWithdrawInputEmpty = !withdrawAmount || withdrawAmount === "0"
  const isWithdrawTooManyDecimals = hasTooManyDecimals(withdrawAmount, market.collateral_token_decimals)
  const isWithdrawOverMax = withdrawAmountBI > currentCollateral
  const withdrawButtonMessage = isWithdrawInputEmpty 
    ? "Enter withdraw amount" 
    : isWithdrawTooManyDecimals
      ? "Too many decimals"
      : isWithdrawOverMax 
        ? "Exceeds max withdrawable" 
        : "Withdraw"

  return {
    // Repay validation
    isRepayInputEmpty,
    isRepayTooManyDecimals,
    isRepayOverMax,
    repayButtonMessage,
    repayAmountBI,
    
    // Withdraw validation
    isWithdrawInputEmpty,
    isWithdrawTooManyDecimals,
    isWithdrawOverMax,
    withdrawButtonMessage,
    withdrawAmountBI,
  }
}
