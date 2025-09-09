"use client"

import { usePositionQuery, useRepayWithApproval, useWithdrawCollateralWithApproval } from "@/app/(app)/borrow/queries-mutations"
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
  
  const repayWithApprovalMutation = useRepayWithApproval()
  const withdrawCollateralWithApprovalMutation = useWithdrawCollateralWithApproval()

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

  const isRepayPending = repayWithApprovalMutation.isPending;
  const isWithdrawPending = withdrawCollateralWithApprovalMutation.isPending;

  const handleRepay = async () => {
    if (isRepayInputEmpty || isRepayTooManyDecimals || isRepayOverMax) return;
    
    const repayAmountInTokens = Number(repayAmount || "0");
    
    repayWithApprovalMutation.mutate({
      marketId: market.poolPath!,
      loanTokenPath: market.loanToken!,
      amount: repayAmountInTokens,
      loanTokenDecimals: market.loanTokenDecimals
    }, {
      onSuccess: () => {
        reset();
      }
    });
  };

  const handleWithdraw = async () => {
    if (isWithdrawInputEmpty || isWithdrawTooManyDecimals || isWithdrawOverMax) return;
    
    const withdrawAmountInTokens = Number(withdrawAmount || "0");
    
    withdrawCollateralWithApprovalMutation.mutate({
      marketId: market.poolPath!,
      collateralTokenPath: market.collateralToken!,
      amount: withdrawAmountInTokens,
      collateralTokenDecimals: market.collateralTokenDecimals
    }, {
      onSuccess: () => {
        reset();
      }
    });
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
        isBorrowValid={!isWithdrawOverMax && !isRepayOverMax}
        healthFactor={healthFactor}
        currentCollateral={formatUnits(currentCollateral, market.collateralTokenDecimals)}
        currentBorrowAssets={formatUnits(currentBorrowAssets, market.loanTokenDecimals)}
      />
    </form>
  )
} 
