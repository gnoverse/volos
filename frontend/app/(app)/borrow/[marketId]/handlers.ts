import { UseFormSetValue } from "react-hook-form"

export const handleMaxSupply = (
  setValue: UseFormSetValue<{
    supplyAmount: string
    borrowAmount: string
    repayAmount: string
    withdrawAmount: string
  }>
) => {
  // todo: set true maximum value according to the user's balance (maybe use tokenhub)
  setValue("supplyAmount", "1000.00");
};

export const handleMaxBorrow = (
  setValue: UseFormSetValue<{
    supplyAmount: string
    borrowAmount: string
    repayAmount: string
    withdrawAmount: string
  }>,
  supplyAmount: string,
  maxBorrowableAmount: number
) => {
  if (supplyAmount && parseFloat(supplyAmount) > 0) {
    setValue("borrowAmount", maxBorrowableAmount.toFixed(2));
  } else {
    setValue("borrowAmount", "0.00");
  }
};
