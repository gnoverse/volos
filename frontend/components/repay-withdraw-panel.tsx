"use client"

import { useApproveTokenMutation, usePositionQuery, useRepayMutation, useWithdrawCollateralMutation } from "@/app/(app)/borrow/queries-mutations"
import { MarketInfo } from "@/app/types"
import { PositionCard } from "@/components/position-card"
import { SidePanelCard } from "@/components/side-panel-card"
import { usePositionCalculations } from "@/hooks/use-position-calculations"
import { useRepayWithdrawValidation } from "@/hooks/use-repay-withdraw-validation"
import { useUserAddress } from "@/hooks/use-user-address"
import { ArrowUp, Minus } from "lucide-react"
import { useForm } from "react-hook-form"
import { formatUnits } from "viem"

interface RepayWithdrawPanelProps {
  market: MarketInfo
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
  const { data: positionData } = usePositionQuery(market.poolPath!, userAddress)
  
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
    
    try {
      await approveTokenMutation.mutateAsync({
        tokenPath: market.loanToken!,
        amount: repayAmountInTokens * Math.pow(10, market.loanTokenDecimals)
      });
      
      await repayMutation.mutateAsync({
        marketId: market.poolPath!,
        userAddress: userAddress!,
        assets: repayAmountInTokens * Math.pow(10, market.loanTokenDecimals)
      });
      
      reset();
    } catch (error) {
      console.error("Repay transaction failed:", error);
    }
  };

  const handleWithdraw = async () => {
    if (isWithdrawInputEmpty || isWithdrawTooManyDecimals || isWithdrawOverMax) return;
    
    const withdrawAmountInTokens = Number(withdrawAmount || "0");
    
    try {
      await approveTokenMutation.mutateAsync({
        tokenPath: market.collateralToken!,
        amount: withdrawAmountInTokens * Math.pow(10, market.collateralTokenDecimals)
      });
      
      await withdrawCollateralMutation.mutateAsync({
        marketId: market.poolPath!,
        userAddress: userAddress!,
        amount: withdrawAmountInTokens * Math.pow(10, market.collateralTokenDecimals)
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
        title={`Repay Loan ${market.loanTokenSymbol}`}
        register={register}
        fieldName="repayAmount"
        tokenSymbol={market.loanTokenSymbol}
        currentBalanceFormatted={formatUnits(currentBorrowAssets, market.loanTokenDecimals)}
        buttonMessage={repayButtonMessage}
        isButtonDisabled={isRepayInputEmpty || isRepayTooManyDecimals || isRepayOverMax || isRepayPending}
        isButtonPending={isRepayPending}
        onMaxClickAction={() => {
          setValue("repayAmount", formatUnits(currentBorrowAssets, market.loanTokenDecimals));
        }}
        onSubmitAction={handleRepay}
        inputValue={repayAmount}
      />

      {/* Withdraw Card */}
      <SidePanelCard
        icon={Minus}
        iconColor="text-purple-400"
        title={`Withdraw Collateral ${market.collateralTokenSymbol}`}
        register={register}
        fieldName="withdrawAmount"
        tokenSymbol={market.collateralTokenSymbol}
        currentBalanceFormatted={formatUnits(currentCollateral, market.collateralTokenDecimals)}
        buttonMessage={withdrawButtonMessage}
        isButtonDisabled={isWithdrawInputEmpty || isWithdrawTooManyDecimals || isWithdrawOverMax || isWithdrawPending}
        isButtonPending={isWithdrawPending}
        onMaxClickAction={() => {
          setValue("withdrawAmount", formatUnits(currentCollateral, market.collateralTokenDecimals));
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
        currentCollateral={formatUnits(currentCollateral, market.collateralTokenDecimals)}
        currentBorrowAssets={formatUnits(currentBorrowAssets, market.loanTokenDecimals)}
      />
    </form>
  )
} 
