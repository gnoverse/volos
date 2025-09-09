import { MarketInfo } from "@/app/types";
import { parseUnits } from "viem";

export function useSupplyWithdrawValidation(
  supplyAmount: string,
  withdrawAmount: string,
  market: MarketInfo,
  currentSupplyAssets: bigint
) {
  const supplyAmountBigInt = supplyAmount ? parseUnits(supplyAmount, market.loanTokenDecimals) : BigInt(0);
  const withdrawAmountBigInt = withdrawAmount ? parseUnits(withdrawAmount, market.loanTokenDecimals) : BigInt(0);

  const isSupplyInputEmpty = !supplyAmount || supplyAmount === "0";
  const isSupplyTooManyDecimals = supplyAmount.includes('.') && supplyAmount.split('.')[1].length > market.loanTokenDecimals;
  const supplyButtonMessage = isSupplyInputEmpty 
    ? "Enter supply amount" 
    : isSupplyTooManyDecimals
      ? `Max ${market.loanTokenDecimals} decimals`
      : "Supply";

  const isWithdrawInputEmpty = !withdrawAmount || withdrawAmount === "0";
  const isWithdrawTooManyDecimals = withdrawAmount.includes('.') && withdrawAmount.split('.')[1].length > market.loanTokenDecimals;
  const isWithdrawOverMax = withdrawAmountBigInt > currentSupplyAssets;
  const withdrawButtonMessage = isWithdrawInputEmpty 
    ? "Enter withdraw amount" 
    : isWithdrawTooManyDecimals
      ? `Max ${market.loanTokenDecimals} decimals`
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
