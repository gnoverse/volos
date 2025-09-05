"use client"

import { useBorrowWithApproval, usePositionQuery, useSupplyCollateralWithApproval } from "@/app/(app)/borrow/queries-mutations"
import { MarketInfo } from "@/app/types"
import { PositionCard } from "@/components/position-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useFormValidation } from "@/hooks/use-form-validation"
import { usePositionCalculations } from "@/hooks/use-position-calculations"
import { useUserAddress } from "@/hooks/use-user-address"
import { ArrowDown, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { formatUnits } from "viem"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl py-4"

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
    currentCollateralStr,
    currentLoanStr,
    maxBorrowableStr,
    calculateMaxBorrowable
  } = usePositionCalculations(positionData ?? {
    borrow: "0",
    supply: "0",
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
  const supplyAmountDisplay = supplyAmount || "0"

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
      {/* Supply Card */}
      <Card className={CARD_STYLES}>
        <CardHeader className="px-4 -mb-4">
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-blue-400" />
            <CardTitle className="text-gray-200 text-sm font-medium mb-0">
              Supply Collateral {market.collateralTokenSymbol}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-1 pt-0 px-4">
          <Input
            type="number"
            {...register("supplyAmount", { pattern: /^[0-9]*\.?[0-9]*$/ })}
            className="text-3xl font-semibold text-gray-200 bg-transparent w-full border-none focus:outline-none p-0"
            placeholder="0.00"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">{supplyAmountDisplay} {market.collateralTokenSymbol}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">{currentCollateralStr} {market.collateralTokenSymbol}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-blue-500 font-medium px-1 py-0 h-6"
                onClick={() => {
                  setValue("supplyAmount", maxBorrowableStr);
                }}
              >
                MAX
              </Button>
            </div>
          </div>
          <Button
            type="button"
            className="w-full mt-1 bg-midnightPurple-800 hover:bg-midnightPurple-900/70 h-8 text-sm"
            disabled={isSupplyInputEmpty || isSupplyTooManyDecimals || isSupplyPending}
            onClick={handleSupply}
          >
            {isSupplyPending ? "Processing..." : supplyButtonMessage}
          </Button>
        </CardContent>
      </Card>

      {/* Borrow Card */}
      <Card className={CARD_STYLES}>
        <CardHeader className="px-4 -mb-4">
          <div className="flex items-center gap-2">
            <ArrowDown size={16} className="text-purple-400" />
            <CardTitle className="text-gray-200 text-sm font-medium mb-0">
              Borrow {market.loanTokenSymbol}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-1 pt-0 px-4">
          <Input
            type="number"
            {...register("borrowAmount", { pattern: /^[0-9]*\.?[0-9]*$/ })}
            className="text-3xl font-semibold text-gray-200 bg-transparent w-full border-none focus:outline-none p-0"
            placeholder="0.00"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">{borrowAmount || "0"} {market.loanTokenSymbol}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">{currentLoanStr} {market.loanTokenSymbol}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-blue-500 font-medium px-1 py-0 h-6"
                onClick={handleMaxBorrow}
              >
                MAX
              </Button>
            </div>
          </div>
          <Button
            type="button"
            className="w-full mt-1 bg-midnightPurple-800 hover:bg-midnightPurple-900/70 h-8 text-sm"
            disabled={isBorrowInputEmpty || isBorrowTooManyDecimals || isBorrowOverMax || isBorrowPending}
            onClick={handleBorrow}
          >
            {isBorrowPending ? "Processing..." : borrowButtonMessage}
          </Button>
        </CardContent>
      </Card>
      
      {/* Position Card */}
      <PositionCard 
        market={market}
        supplyAmount={supplyAmount}
        borrowAmount={borrowAmount}
        maxBorrowableAmount={parseFloat(maxBorrowableStr)}
        isBorrowValid={!isBorrowOverMax}
        healthFactor={"-"}
        currentCollateral={parseFloat(currentCollateralStr)}
        currentLoan={parseFloat(currentLoanStr)}
        ltv={String(positionMetrics.ltv * 100)}
      />
    </form>
  )
} 
