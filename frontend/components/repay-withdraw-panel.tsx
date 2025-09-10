"use client"

import { useApproveTokenMutation, usePositionQuery, useRepayMutation, useWithdrawCollateralMutation } from "@/app/(app)/borrow/queries-mutations"
import { getAllowance } from "@/app/services/abci"
import { Market } from "@/app/types"
import { PositionCard } from "@/components/position-card"
import { SidePanelCard } from "@/components/side-panel-card"
import { usePositionCalculations } from "@/hooks/use-position-calculations"
import { useRepayWithdrawValidation } from "@/hooks/use-repay-withdraw-validation"
import { useUserAddress } from "@/hooks/use-user-address"
import { ArrowUp, Minus } from "lucide-react"
import { useForm } from "react-hook-form"
import { formatUnits } from "viem"

interface RepayWithdrawPanelProps {
  market: Market
}

export function RepayWithdrawPanel({
  market,
}: RepayWithdrawPanelProps) {
  const { register, setValue, watch, reset } = useForm({
    defaultValues: {
      repayAmount: "",
      withdrawAmount: ""
    }
  })

  const { userAddress } = useUserAddress()
  const { data: positionData } = usePositionQuery(market.id, userAddress)
  
  const {
    currentCollateral,
    currentBorrowAssets,
    healthFactor
  } = usePositionCalculations(positionData ?? {
    borrow_shares: "0",
    supply_shares: "0",
    collateral_supply: "0"
  }, market)
  
  const approveTokenMutation = useApproveTokenMutation()
  const repayMutation = useRepayMutation()
  const withdrawCollateralMutation = useWithdrawCollateralMutation()

  const repayAmount = watch("repayAmount");
  const withdrawAmount = watch("withdrawAmount");

  const {
    isRepayInputEmpty,
    isRepayTooManyDecimals,
    isRepayOverMax,
    repayButtonMessage,
    isWithdrawInputEmpty,
    isWithdrawTooManyDecimals,
    isWithdrawOverMax,
    withdrawButtonMessage,
  } = useRepayWithdrawValidation(
    repayAmount,
    withdrawAmount,
    market,
    currentBorrowAssets,
    currentCollateral
  );

  const isRepayPending = repayMutation.isPending || approveTokenMutation.isPending;
  const isWithdrawPending = withdrawCollateralMutation.isPending || approveTokenMutation.isPending;

  const handleRepay = async () => {
    if (isRepayInputEmpty || isRepayTooManyDecimals || isRepayOverMax) return;
    
    const repayAmountInTokens = Number(repayAmount || "0");
    const repayAmountInDenom = repayAmountInTokens * Math.pow(10, market.loan_token_decimals);
    
    try {
      const currentAllowance = BigInt(await getAllowance(market.loan_token, userAddress!));
      
      if (currentAllowance < BigInt(repayAmountInDenom)) {
        await approveTokenMutation.mutateAsync({
          tokenPath: market.loan_token,
          amount: repayAmountInDenom
        });
      }
      
      await repayMutation.mutateAsync({
        marketId: market.id,
        userAddress: userAddress!,
        assets: repayAmountInDenom
      });
      
      reset();
    } catch (error) {
      console.error("Repay transaction failed:", error);
    }
  };

  const handleWithdraw = async () => {
    if (isWithdrawInputEmpty || isWithdrawTooManyDecimals || isWithdrawOverMax) return;
    
    const withdrawAmountInTokens = Number(withdrawAmount || "0");
    const withdrawAmountInDenom = withdrawAmountInTokens * Math.pow(10, market.collateral_token_decimals);
    
    try {
      const currentAllowance = BigInt(await getAllowance(market.collateral_token, userAddress!));
      
      if (currentAllowance < BigInt(withdrawAmountInDenom)) {
        await approveTokenMutation.mutateAsync({
          tokenPath: market.collateral_token,
          amount: withdrawAmountInDenom
        });
      }
      
      await withdrawCollateralMutation.mutateAsync({
        marketId: market.id,
        userAddress: userAddress!,
        amount: withdrawAmountInDenom
      });
      
      reset();
    } catch (error) {
      console.error("Withdraw collateral transaction failed:", error);
    }
  };

  return (
    <form className="space-y-3">
      {/* Repay Card */}
      <SidePanelCard
        icon={ArrowUp}
        iconColor="text-blue-400"
        title={`Repay Loan ${market.loan_token_symbol}`}
        register={register}
        fieldName="repayAmount"
        tokenSymbol={market.loan_token_symbol}
        currentBalanceFormatted={formatUnits(currentBorrowAssets, market.loan_token_decimals)}
        buttonMessage={repayButtonMessage}
        isButtonDisabled={isRepayInputEmpty || isRepayTooManyDecimals || isRepayOverMax || isRepayPending}
        isButtonPending={isRepayPending}
        onMaxClickAction={() => {
          setValue("repayAmount", formatUnits(currentBorrowAssets, market.loan_token_decimals));
        }}
        onSubmitAction={handleRepay}
        inputValue={repayAmount}
      />

      {/* Withdraw Card */}
      <SidePanelCard
        icon={Minus}
        iconColor="text-purple-400"
        title={`Withdraw Collateral ${market.collateral_token_symbol}`}
        register={register}
        fieldName="withdrawAmount"
        tokenSymbol={market.collateral_token_symbol}
        currentBalanceFormatted={formatUnits(currentCollateral, market.collateral_token_decimals)}
        buttonMessage={withdrawButtonMessage}
        isButtonDisabled={isWithdrawInputEmpty || isWithdrawTooManyDecimals || isWithdrawOverMax || isWithdrawPending}
        isButtonPending={isWithdrawPending}
        onMaxClickAction={() => {
          setValue("withdrawAmount", formatUnits(currentCollateral, market.collateral_token_decimals));
        }}
        onSubmitAction={handleWithdraw}
        inputValue={withdrawAmount}
      />

      {/* Position Card */}
      <PositionCard 
        market={market}
        repayAmount={repayAmount}
        withdrawAmount={withdrawAmount}
        healthFactor={healthFactor}
        currentCollateral={formatUnits(currentCollateral, market.collateral_token_decimals)}
        currentBorrowAssets={formatUnits(currentBorrowAssets, market.loan_token_decimals)}
      />
    </form>
  )
} 
