import { MarketInfo } from "@/app/types"
import { parseUnits } from "viem"

/**
 * Custom hook that provides form validation logic for supply and borrow inputs
 */
export function useFormValidation(
  supplyAmount: string,
  borrowAmount: string,
  market: MarketInfo,
  maxBorrow: bigint
) {
  const hasTooManyDecimals = (input: string, maxDecimals: number): boolean => {
    if (!input || input === "0") return false
    const decimalIndex = input.indexOf('.')
    if (decimalIndex === -1) return false
    const decimalPart = input.substring(decimalIndex + 1)
    return decimalPart.length > maxDecimals
  }

  const borrowAmountBI = parseUnits(borrowAmount || "0", market.loanTokenDecimals)

  const isSupplyInputEmpty = !supplyAmount || supplyAmount === "0"
  const isSupplyTooManyDecimals = hasTooManyDecimals(supplyAmount, market.collateralTokenDecimals)
  const supplyButtonMessage = isSupplyInputEmpty 
    ? "Enter supply amount" 
    : isSupplyTooManyDecimals 
      ? "Too many decimals" 
      : "Supply"

  const isBorrowInputEmpty = !borrowAmount || borrowAmount === "0"
  const isBorrowTooManyDecimals = hasTooManyDecimals(borrowAmount, market.loanTokenDecimals)
  const isBorrowOverMax = borrowAmountBI > maxBorrow
  const borrowButtonMessage = isBorrowInputEmpty
    ? "Enter borrow amount"
    : isBorrowTooManyDecimals
      ? "Too many decimals"
      : isBorrowOverMax
        ? "Exceeds max borrow"
        : "Borrow"

  return {
    isSupplyInputEmpty,
    isSupplyTooManyDecimals,
    supplyButtonMessage,
    
    isBorrowInputEmpty,
    isBorrowTooManyDecimals,
    isBorrowOverMax,
    borrowButtonMessage,
    
    borrowAmountBI
  }
}
