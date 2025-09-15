"use client"

import { useApproveTokenMutation, useBorrowMutation, useSupplyCollateralMutation } from "@/hooks/use-mutations"
import { usePositionQuery } from "@/hooks/use-queries"
import { getAllowance, getTokenBalance } from "@/app/services/abci"
import { VOLOS_ADDRESS } from "@/app/services/tx.service"
import { Market } from "@/app/types"
import { formatPrice } from "@/app/utils/format.utils"
import { PositionCard } from "@/components/position-card"
import { SidePanelCard } from "@/components/side-panel-card"
import { TransactionSuccessDialog } from "@/components/transaction-success-dialog"
import { useFormValidation } from "@/hooks/use-borrow-validation"
import { useMaxBorrowable } from "@/hooks/use-max-borrowable"
import { usePositionCalculations } from "@/hooks/use-position-calculations"
import { useUserAddress } from "@/hooks/use-user-address"
import { ArrowDown, Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { formatUnits } from "viem"

interface AddBorrowPanelProps {
  market: Market
}

export function AddBorrowPanel({
  market,
}: AddBorrowPanelProps) {
  const { register, setValue, watch, reset } = useForm({
    defaultValues: {
      supplyAmount: "",
      borrowAmount: "",
      repayAmount: "",
      withdrawAmount: ""
    }
  })

  const { userAddress } = useUserAddress()
  const { data: positionData, refetch: refetchPosition } = usePositionQuery(market.id, userAddress)
  
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
  }, market)

  const { maxBorrowable, refetch: refetchMaxBorrowable } = useMaxBorrowable(
    positionData ?? {
      borrow_shares: "0",
      supply_shares: "0",
      collateral_supply: "0"
    },
    market,
    userAddress
  )

  const {
    isSupplyInputEmpty,
    isSupplyTooManyDecimals,
    supplyButtonMessage,
    isBorrowInputEmpty,
    isBorrowTooManyDecimals,
    isBorrowOverMax,
    borrowButtonMessage
  } = useFormValidation(
    watch("supplyAmount"),
    watch("borrowAmount"),
    market,
    maxBorrowable
  )

  const approveTokenMutation = useApproveTokenMutation()
  const supplyCollateralMutation = useSupplyCollateralMutation()
  const borrowMutation = useBorrowMutation()

  const supplyAmount = watch("supplyAmount")
  const borrowAmount = watch("borrowAmount")

  const isSupplyPending = supplyCollateralMutation.isPending || approveTokenMutation.isPending
  const isBorrowPending = borrowMutation.isPending || approveTokenMutation.isPending

  // Calculate formatted price for USD value display
  // Price decimals: 36 + loan_token_decimals - collateral_token_decimals
  const priceDecimals = 36 + market.loan_token_decimals - market.collateral_token_decimals;
  const formattedPrice = parseFloat(formatPrice(market.current_price, priceDecimals, market.loan_token_decimals));

  const handleMaxBorrow = async () => {
    try {
      // Refetch both position and max borrowable to get latest data
      await Promise.all([
        refetchPosition(),
        refetchMaxBorrowable()
      ])
      
      const maxBorrowableStr = formatUnits(maxBorrowable, market.loan_token_decimals)
      setValue("borrowAmount", maxBorrowableStr)
    } catch (error) {
      console.error("Failed to fetch latest data:", error)
    }
  }

  const handleSupply = async () => {
    if (isSupplyInputEmpty || isSupplyTooManyDecimals) return;
    
    const supplyAmountInTokens = Number(supplyAmount || "0");
    const supplyAmountInDenom = supplyAmountInTokens * Math.pow(10, market.collateral_token_decimals);
    
    try {
      const currentAllowance = BigInt(await getAllowance(market.collateral_token, userAddress!));
      
      if (currentAllowance < BigInt(supplyAmountInDenom)) {
        await approveTokenMutation.mutateAsync({
          tokenPath: market.collateral_token,
          amount: supplyAmountInDenom,
          spenderAddress: VOLOS_ADDRESS
        });
      }
      
      const response = await supplyCollateralMutation.mutateAsync({
        marketId: market.id,
        userAddress: userAddress!,
        amount: supplyAmountInDenom
      });
      
      if (response.status === 'success') {
        setSuccessDialogData({
          title: "Supply Collateral Successful",
          txHash: (response as { txHash?: string; hash?: string }).txHash || (response as { txHash?: string; hash?: string }).hash
        });
        setShowSuccessDialog(true);
        reset();
      }
    } catch (error) {
      console.error("Supply collateral transaction failed:", error);
    }
  };

  const handleBorrow = async () => {
    if (isBorrowInputEmpty || isBorrowTooManyDecimals || isBorrowOverMax) return;
    
    const borrowAmountInTokens = Number(borrowAmount || "0");
    const borrowAmountInDenom = borrowAmountInTokens * Math.pow(10, market.loan_token_decimals);
    
    try {
      const currentAllowance = BigInt(await getAllowance(market.loan_token, userAddress!));
      
      if (currentAllowance < BigInt(borrowAmountInDenom)) {
        await approveTokenMutation.mutateAsync({
          tokenPath: market.loan_token,
          amount: borrowAmountInDenom,
          spenderAddress: VOLOS_ADDRESS
        });
      }
      
      const response = await borrowMutation.mutateAsync({
        marketId: market.id,
        userAddress: userAddress!,
        assets: borrowAmountInDenom
      });
      
      if (response.status === 'success') {
        setSuccessDialogData({
          title: "Borrow Successful",
          txHash: (response as { txHash?: string; hash?: string }).txHash || (response as { txHash?: string; hash?: string }).hash
        });
        setShowSuccessDialog(true);
        reset();
      }
    } catch (error) {
      console.error("Borrow transaction failed:", error);
    }
  };

  return (
    <>
      <form className="space-y-3">
      {/* Borrow Card */}
      <SidePanelCard
        icon={ArrowDown}
        iconColor="text-purple-400"
        title={`Borrow ${market.loan_token_symbol}`}
        register={register}
        fieldName="borrowAmount"  
        buttonMessage={borrowButtonMessage}
        isButtonDisabled={isBorrowInputEmpty || isBorrowTooManyDecimals || isBorrowOverMax || isBorrowPending}
        isButtonPending={isBorrowPending}
        onMaxClickAction={handleMaxBorrow}
        onSubmitAction={handleBorrow}
        inputValue={borrowAmount}
        price={1}
      />
      
      {/* Supply Card */}
      <SidePanelCard
        icon={Plus}
        iconColor="text-blue-400"
        title={`Supply Collateral ${market.collateral_token_symbol}`}
        register={register}
        fieldName="supplyAmount"
        buttonMessage={supplyButtonMessage}
        isButtonDisabled={isSupplyInputEmpty || isSupplyTooManyDecimals || isSupplyPending}
        isButtonPending={isSupplyPending}
        onMaxClickAction={async () => {
          try {
            const balance = await getTokenBalance(market.collateral_token, userAddress!);
            const balanceFormatted = formatUnits(BigInt(balance), market.collateral_token_decimals);
            setValue("supplyAmount", balanceFormatted);
          } catch (error) {
            console.error("Failed to fetch collateral balance:", error);
          }
        }}
        onSubmitAction={handleSupply}
        inputValue={supplyAmount}
        price={formattedPrice}
      />

      {/* Position Card */}
      <PositionCard 
        market={market}
        supplyAmount={supplyAmount}
        borrowAmount={borrowAmount}
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
