"use client"

import { getAllowance } from "@/app/services/abci"
import { VOLOS_ADDRESS } from "@/app/services/tx.service"
import { Market } from "@/app/types"
import { formatPrice } from "@/app/utils/format.utils"
import { PositionCard } from "@/components/position-card"
import { SidePanelCard } from "@/components/side-panel-card"
import { TransactionSuccessDialog } from "@/components/transaction-success-dialog"
import { useMaxRepayable } from "@/hooks/use-max-repayable"
import { useApproveTokenMutation, useRepayMutation, useWithdrawCollateralMutation } from "@/hooks/use-mutations"
import { usePositionCalculations } from "@/hooks/use-position-calculations"
import { useExpectedBorrowAssetsQuery, usePositionQuery } from "@/hooks/use-queries"
import { useRepayWithdrawValidation } from "@/hooks/use-repay-withdraw-validation"
import { useUserAddress } from "@/hooks/use-user-address"
import { ArrowUp, Minus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { formatUnits, parseUnits } from "viem"

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
  const { data: expectedBorrowAssets } = useExpectedBorrowAssetsQuery(market.id, userAddress)

  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successDialogData, setSuccessDialogData] = useState<{
    title: string
    txHash?: string
  }>({ title: "", txHash: "" })
  
  const {
    positionMetrics,
    currentCollateral,
    currentBorrowAssets,
  } = usePositionCalculations(positionData ?? {
    borrow_shares: "0",
    supply_shares: "0",
    collateral_supply: "0"
  }, market, expectedBorrowAssets || "")

  const { maxRepayable, refetch: refetchMaxRepayable } = useMaxRepayable(
    expectedBorrowAssets || "1",
    market,
    userAddress
  )
  
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
    maxRepayable,
    currentCollateral
  );

  const isRepayPending = repayMutation.isPending || approveTokenMutation.isPending;
  const isWithdrawPending = withdrawCollateralMutation.isPending || approveTokenMutation.isPending;

  // Calculate formatted price for USD value display
  // Price decimals: 36 + loan_token_decimals - collateral_token_decimals
  const priceDecimals = 36 + market.loan_token_decimals - market.collateral_token_decimals;
  const formattedPrice = parseFloat(formatPrice(market.current_price, priceDecimals, market.loan_token_decimals));

  const handleRepay = async () => {
    if (isRepayInputEmpty || isRepayTooManyDecimals || isRepayOverMax) return;
    
    const repayAmountInDenom = parseUnits(repayAmount || "0", market.loan_token_decimals);
    
    const currentAllowance = BigInt(await getAllowance(market.loan_token, userAddress!));
    
    if (currentAllowance < repayAmountInDenom) {
      await approveTokenMutation.mutateAsync({
        tokenPath: market.loan_token,
        amount: Number(repayAmountInDenom),
        spenderAddress: VOLOS_ADDRESS
      }); 
    }
    
    const response = await repayMutation.mutateAsync({
      marketId: market.id,
      userAddress: userAddress!,
      assets: Number(repayAmountInDenom)
    });
    
    if (response.status === 'success') {
      setSuccessDialogData({
        title: "Repay Successful",
        txHash: (response as { txHash?: string; hash?: string }).txHash || (response as { txHash?: string; hash?: string }).hash
      });
      setShowSuccessDialog(true);
      reset();
    }
  };

  const handleWithdraw = async () => {
    if (isWithdrawInputEmpty || isWithdrawTooManyDecimals || isWithdrawOverMax) return;
    
    const withdrawAmountInDenom = parseUnits(withdrawAmount || "0", market.collateral_token_decimals);
    
    const currentAllowance = BigInt(await getAllowance(market.collateral_token, userAddress!));
    
    if (currentAllowance < withdrawAmountInDenom) {
      await approveTokenMutation.mutateAsync({
        tokenPath: market.collateral_token,
        amount: Number(withdrawAmountInDenom),
        spenderAddress: VOLOS_ADDRESS
      });
    }
    
    const response = await withdrawCollateralMutation.mutateAsync({
      marketId: market.id,
      userAddress: userAddress!,
      amount: Number(withdrawAmountInDenom)
    });
    
    if (response.status === 'success') {
      setSuccessDialogData({
        title: "Withdraw Collateral Successful",
        txHash: (response as { txHash?: string; hash?: string }).txHash || (response as { txHash?: string; hash?: string }).hash
      });
      setShowSuccessDialog(true);
      reset();
    }
  };

  return (
    <>
    <form className="space-y-3">
      {/* Repay Card */}
      <SidePanelCard
        icon={ArrowUp}
        iconColor="text-blue-400"
        title={`Repay Loan ${market.loan_token_symbol}`}
        register={register}
        fieldName="repayAmount"
        buttonMessage={repayButtonMessage}
        isButtonDisabled={isRepayInputEmpty || isRepayTooManyDecimals || isRepayOverMax || isRepayPending}
        isButtonPending={isRepayPending}
        onMaxClickAction={async () => {
          await refetchMaxRepayable()
          setValue("repayAmount", formatUnits(maxRepayable, market.loan_token_decimals));
        }}
        onSubmitAction={handleRepay}
        inputValue={repayAmount}
        price={1}
      />

      {/* Withdraw Card */}
      <SidePanelCard
        icon={Minus}
        iconColor="text-purple-400"
        title={`Withdraw Collateral ${market.collateral_token_symbol}`}
        register={register}
        fieldName="withdrawAmount"
        buttonMessage={withdrawButtonMessage}
        isButtonDisabled={isWithdrawInputEmpty || isWithdrawTooManyDecimals || isWithdrawOverMax || isWithdrawPending}
        isButtonPending={isWithdrawPending}
        onMaxClickAction={() => {
          setValue("withdrawAmount", formatUnits(currentCollateral, market.collateral_token_decimals));
        }}
        onSubmitAction={handleWithdraw}
        inputValue={withdrawAmount}
        price={formattedPrice}
      />

      {/* Position Card */}
      <PositionCard 
        market={market}
        repayAmount={repayAmount}
        withdrawAmount={withdrawAmount}
        healthFactor={positionMetrics.healthFactor}
        currentCollateral={formatUnits(currentCollateral, market.collateral_token_decimals)}
        currentBorrowAssets={formatUnits(currentBorrowAssets, market.loan_token_decimals)}
      />
    </form>

    {/* Success Dialog */}
    <TransactionSuccessDialog
      isOpen={showSuccessDialog}
      onClose={() => setShowSuccessDialog(false)}
      title={successDialogData.title}
      txHash={successDialogData.txHash}
    />
    </>
  )
} 
