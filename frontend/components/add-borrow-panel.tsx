"use client"

import { useApproveTokenMutation, useBorrowMutation, usePositionQuery, useSupplyCollateralMutation } from "@/app/(app)/borrow/queries-mutations"
import { getAllowance, getTokenBalance } from "@/app/services/abci"
import { MarketInfo } from "@/app/types"
import { PositionCard } from "@/components/position-card"
import { SidePanelCard } from "@/components/side-panel-card"
import { useFormValidation } from "@/hooks/use-borrow-validation"
import { usePositionCalculations } from "@/hooks/use-position-calculations"
import { useUserAddress } from "@/hooks/use-user-address"
import { ArrowDown, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { formatUnits } from "viem"

interface AddBorrowPanelProps {
  market: MarketInfo
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
  const { data: positionData, refetch: refetchPosition } = usePositionQuery(market.poolPath!, userAddress)
  
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
        const maxBorrowableStr = formatUnits(positionMetrics.maxBorrow, market.loanTokenDecimals)
        setValue("borrowAmount", maxBorrowableStr)
      }
    } catch (error) {
      console.error("Failed to fetch latest position:", error)
    }
  }

  const handleSupply = async () => {
    if (isSupplyInputEmpty || isSupplyTooManyDecimals) return;
    
    const supplyAmountInTokens = Number(supplyAmount || "0");
    const supplyAmountInDenom = supplyAmountInTokens * Math.pow(10, market.collateralTokenDecimals);
    
    try {
      const currentAllowance = BigInt(await getAllowance(market.collateralToken!, userAddress!));
      
      if (currentAllowance < BigInt(supplyAmountInDenom)) {
        await approveTokenMutation.mutateAsync({
          tokenPath: market.collateralToken!,
          amount: supplyAmountInDenom
        });
      }
      
      await supplyCollateralMutation.mutateAsync({
        marketId: market.poolPath!,
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
    const borrowAmountInDenom = borrowAmountInTokens * Math.pow(10, market.loanTokenDecimals);
    
    try {
      const currentAllowance = BigInt(await getAllowance(market.loanToken!, userAddress!));
      
      if (currentAllowance < BigInt(borrowAmountInDenom)) {
        await approveTokenMutation.mutateAsync({
          tokenPath: market.loanToken!,
          amount: borrowAmountInDenom
        });
      }
      
      await borrowMutation.mutateAsync({
        marketId: market.poolPath!,
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
        title={`Borrow ${market.loanTokenSymbol}`}
        register={register}
        fieldName="borrowAmount"
        tokenSymbol={market.loanTokenSymbol}
        currentBalanceFormatted={formatUnits(currentBorrowAssets, market.loanTokenDecimals)}
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
        title={`Supply Collateral ${market.collateralTokenSymbol}`}
        register={register}
        fieldName="supplyAmount"
        tokenSymbol={market.collateralTokenSymbol}
        currentBalanceFormatted={formatUnits(currentCollateral, market.collateralTokenDecimals)}
        buttonMessage={supplyButtonMessage}
        isButtonDisabled={isSupplyInputEmpty || isSupplyTooManyDecimals || isSupplyPending}
        isButtonPending={isSupplyPending}
        onMaxClickAction={async () => {
          try {
            const balance = await getTokenBalance(market.collateralToken!, userAddress!);
            const balanceFormatted = formatUnits(BigInt(balance), market.collateralTokenDecimals);
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
        currentCollateral={formatUnits(currentCollateral, market.collateralTokenDecimals)}
        currentBorrowAssets={formatUnits(currentBorrowAssets, market.loanTokenDecimals)}
      />
    </form>
  )
} 
