import { Market } from "@/app/types";
import { parseUnits } from "viem";

export function useSupplyWithdrawValidation(
  supplyAmount: string,
  withdrawAmount: string,
  market: Market,
  currentSupplyAssets: bigint
) {
  const supplyAmountBigInt = supplyAmount ? parseUnits(supplyAmount, market.loan_token_decimals) : BigInt(0);
  const withdrawAmountBigInt = withdrawAmount ? parseUnits(withdrawAmount, market.loan_token_decimals) : BigInt(0);

  const isSupplyInputEmpty = !supplyAmount || supplyAmount === "0";
  const isSupplyTooManyDecimals = supplyAmount.includes('.') && supplyAmount.split('.')[1].length > market.loan_token_decimals;
  const supplyButtonMessage = isSupplyInputEmpty 
    ? "Enter supply amount" 
    : isSupplyTooManyDecimals
      ? `Max ${market.loan_token_decimals} decimals`
      : "Supply";

  const isWithdrawInputEmpty = !withdrawAmount || withdrawAmount === "0";
  const isWithdrawTooManyDecimals = withdrawAmount.includes('.') && withdrawAmount.split('.')[1].length > market.loan_token_decimals;
  const isWithdrawOverMax = withdrawAmountBigInt > currentSupplyAssets;
  const withdrawButtonMessage = isWithdrawInputEmpty 
    ? "Enter withdraw amount" 
    : isWithdrawTooManyDecimals
      ? `Max ${market.loan_token_decimals} decimals`
      : isWithdrawOverMax 
        ? "Exceeds max withdrawable" 
        : "Withdraw";

  return {
    isSupplyInputEmpty,
    isSupplyTooManyDecimals,
    supplyButtonMessage,
    supplyAmountBigInt,
    isWithdrawInputEmpty,
    isWithdrawTooManyDecimals,
    isWithdrawOverMax,
    withdrawButtonMessage,
    withdrawAmountBigInt,
  };
}
