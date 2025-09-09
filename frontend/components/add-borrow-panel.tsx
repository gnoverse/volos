"use client"

import { useBorrowWithApproval, usePositionQuery, useSupplyCollateralWithApproval } from "@/app/(app)/borrow/queries-mutations"
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
    maxBorrow,
    calculateMaxBorrowable,
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

  const supplyCollateralMutation = useSupplyCollateralWithApproval()
  const borrowMutation = useBorrowWithApproval()

  const supplyAmount = watch("supplyAmount")
  const borrowAmount = watch("borrowAmount")

  const isSupplyPending = supplyCollateralMutation.isPending
  const isBorrowPending = borrowMutation.isPending

  const handleMaxBorrow = async () => {
    try {
      const { data: latestPosition } = await refetchPosition()
      
      if (latestPosition) {
        const maxBorrowable = calculateMaxBorrowable(latestPosition)
        const maxBorrowableStr = formatUnits(maxBorrowable, market.loanTokenDecimals)
        setValue("borrowAmount", maxBorrowableStr)
      }
    } catch (error) {
      console.error("Failed to fetch latest position:", error)
    }
  }

  const handleSupply = async () => {
    if (isSupplyInputEmpty || isSupplyTooManyDecimals) return;
    
    const supplyAmountInTokens = Number(supplyAmount || "0");
    
    supplyCollateralMutation.mutate({
      marketId: market.poolPath!,
      collateralTokenPath: market.collateralToken!,
      amount: supplyAmountInTokens,
      collateralTokenDecimals: market.collateralTokenDecimals
    }, {
      onSuccess: () => {
        reset();
      }
    });
  };

  const handleBorrow = async () => {
    if (isBorrowInputEmpty || isBorrowTooManyDecimals || isBorrowOverMax) return;
    
    const borrowAmountInTokens = Number(borrowAmount || "0");
    
    borrowMutation.mutate({
      marketId: market.poolPath!,
      loanTokenPath: market.loanToken!,
      amount: borrowAmountInTokens,
      loanTokenDecimals: market.loanTokenDecimals
    }, {
      onSuccess: () => {
        reset();
      }
    });
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
        onMaxClickAction={() => {
          setValue("supplyAmount", formatUnits(maxBorrow, market.loanTokenDecimals));
        }}
        onSubmitAction={handleSupply}
        inputValue={supplyAmount}
      />

      {/* Position Card */}
      <PositionCard 
        market={market}
        supplyAmount={supplyAmount}
        borrowAmount={borrowAmount}
        maxBorrow={formatUnits(maxBorrow, market.loanTokenDecimals)}
        isBorrowValid={!isBorrowOverMax}
        healthFactor={healthFactor}
        currentCollateral={formatUnits(currentCollateral, market.collateralTokenDecimals)}
        currentBorrowAssets={formatUnits(currentBorrowAssets, market.loanTokenDecimals)}
      />
    </form>
  )
} 
