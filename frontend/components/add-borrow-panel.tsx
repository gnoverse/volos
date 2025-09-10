"use client"

import { useApproveTokenMutation, useBorrowMutation, usePositionQuery, useSupplyCollateralMutation } from "@/app/(app)/borrow/queries-mutations"
import { getAllowance, getTokenBalance } from "@/app/services/abci"
import { Market } from "@/app/types"
import { PositionCard } from "@/components/position-card"
import { SidePanelCard } from "@/components/side-panel-card"
import { useFormValidation } from "@/hooks/use-borrow-validation"
import { usePositionCalculations } from "@/hooks/use-position-calculations"
import { useUserAddress } from "@/hooks/use-user-address"
import { ArrowDown, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { formatUnits } from "viem"

interface AddBorrowPanelProps {
  market: Market
}

export function AddBorrowPanel({
  market,
}: AddBorrowPanelProps) {
  // Form setup
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

  const {
    positionMetrics,
    currentCollateral,
    currentBorrowAssets,
    healthFactor
  } = usePositionCalculations(positionData ?? {
    borrow_shares: "0",
    supply_shares: "0",
    collateral_supply: "0"
  }, market)

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
    positionMetrics.maxBorrow
  )

  const approveTokenMutation = useApproveTokenMutation()
  const supplyCollateralMutation = useSupplyCollateralMutation()
  const borrowMutation = useBorrowMutation()

  const supplyAmount = watch("supplyAmount")
  const borrowAmount = watch("borrowAmount")

  const isSupplyPending = supplyCollateralMutation.isPending || approveTokenMutation.isPending
  const isBorrowPending = borrowMutation.isPending || approveTokenMutation.isPending

  const handleMaxBorrow = async () => {
    try {
      const { data: latestPosition } = await refetchPosition()
      
      if (latestPosition) {
        const maxBorrowableStr = formatUnits(positionMetrics.maxBorrow, market.loan_token_decimals)
        setValue("borrowAmount", maxBorrowableStr)
      }
    } catch (error) {
      console.error("Failed to fetch latest position:", error)
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
          amount: supplyAmountInDenom
        });
      }
      
      await supplyCollateralMutation.mutateAsync({
        marketId: market.id,
        userAddress: userAddress!,
        amount: supplyAmountInDenom
      });
      
      reset();
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
          amount: borrowAmountInDenom
        });
      }
      
      await borrowMutation.mutateAsync({
        marketId: market.id,
        userAddress: userAddress!,
        assets: borrowAmountInDenom
      });
      
      reset();
    } catch (error) {
      console.error("Borrow transaction failed:", error);
    }
  };

  return (
    <form className="space-y-3">
      {/* Borrow Card */}
      <SidePanelCard
        icon={ArrowDown}
        iconColor="text-purple-400"
        title={`Borrow ${market.loan_token_symbol}`}
        register={register}
        fieldName="borrowAmount"
        tokenSymbol={market.loan_token_symbol}
        currentBalanceFormatted={formatUnits(currentBorrowAssets, market.loan_token_decimals)}
        buttonMessage={borrowButtonMessage}
        isButtonDisabled={isBorrowInputEmpty || isBorrowTooManyDecimals || isBorrowOverMax || isBorrowPending}
        isButtonPending={isBorrowPending}
        onMaxClickAction={handleMaxBorrow}
        onSubmitAction={handleBorrow}
        inputValue={borrowAmount}
      />
      
      {/* Supply Card */}
      <SidePanelCard
        icon={Plus}
        iconColor="text-blue-400"
        title={`Supply Collateral ${market.collateral_token_symbol}`}
        register={register}
        fieldName="supplyAmount"
        tokenSymbol={market.collateral_token_symbol}
        currentBalanceFormatted={formatUnits(currentCollateral, market.collateral_token_decimals)}
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
      />

      {/* Position Card */}
      <PositionCard 
        market={market}
        supplyAmount={supplyAmount}
        borrowAmount={borrowAmount}
        healthFactor={healthFactor}
        currentCollateral={formatUnits(currentCollateral, market.collateral_token_decimals)}
        currentBorrowAssets={formatUnits(currentBorrowAssets, market.loan_token_decimals)}
      />
    </form>
  )
} 
