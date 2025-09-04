"use client"

import { useApproveTokenMutation, useBorrowMutation, useSupplyCollateralMutation } from "@/app/(app)/borrow/queries-mutations"
import { MarketInfo, Position } from "@/app/types"
import { PositionCard } from "@/components/position-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowDown, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { formatUnits, parseUnits } from "viem"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl py-4"

interface AddBorrowPanelProps {
  market: MarketInfo
  positionData: Position
}

export function AddBorrowPanel({
  market,
  positionData = {
    collateral_supply: "0",
    loan: "0",
    supply: "0",
    ltv: 0,
    health_factor: 0
  },
}: AddBorrowPanelProps) {
    const { register, setValue, watch, reset } = useForm({
        defaultValues: {
            supplyAmount: "",
            borrowAmount: "",
            repayAmount: "",
            withdrawAmount: ""
        }
    })
  
  const queryClient = useQueryClient()
  const supplyCollateralMutation = useSupplyCollateralMutation()
  const borrowMutation = useBorrowMutation()
  const approveTokenMutation = useApproveTokenMutation()
  
  const currentCollateralBI = BigInt(positionData.collateral_supply)
  const currentLoanBI = BigInt(positionData.loan)

  const supplyAmount = watch("supplyAmount");
  const borrowAmount = watch("borrowAmount");

  // Helper to check if input has too many decimal places
  const hasTooManyDecimals = (input: string, maxDecimals: number): boolean => {
    if (!input || input === "0") return false
    const decimalIndex = input.indexOf('.')
    if (decimalIndex === -1) return false
    const decimalPart = input.substring(decimalIndex + 1)
    return decimalPart.length > maxDecimals
  }

  // Convert user inputs to uint256 units for calculations
  const supplyAmountBI = parseUnits(supplyAmount, market.collateralTokenDecimals)
  const borrowAmountBI = parseUnits(borrowAmount, market.loanTokenDecimals)

  // LTV as scaled integer to avoid float math (fallback until API provides ltv_scaled)
  const LTV_SCALE = BigInt(1_000_000_000) // 1e9
  const ltvScaled: bigint = BigInt(Math.round((positionData?.ltv ?? 0) * Number(LTV_SCALE)))

  const totalCollateralBI = currentCollateralBI + supplyAmountBI
  // maxBorrowable = totalCollateral * ltv - currentLoan, in loan token denom units
  let maxBorrowableBI = (totalCollateralBI * ltvScaled) / LTV_SCALE - currentLoanBI
  if (maxBorrowableBI < BigInt(0)) maxBorrowableBI = BigInt(0)

  // Display strings - format uint256 values from DB, keep user input as-is
  const supplyAmountDisplay = supplyAmount || "0"
  const currentCollateralStr = formatUnits(currentCollateralBI, market.collateralTokenDecimals)
  const currentLoanStr = formatUnits(currentLoanBI, market.loanTokenDecimals)
  const maxBorrowableStr = formatUnits(maxBorrowableBI, market.loanTokenDecimals)

  const isSupplyInputEmpty = !supplyAmount || supplyAmount === "0";
  const isSupplyTooManyDecimals = hasTooManyDecimals(supplyAmount, market.collateralTokenDecimals);
  const supplyButtonMessage = isSupplyInputEmpty 
    ? "Enter supply amount" 
    : isSupplyTooManyDecimals 
      ? "Too many decimals" 
      : "Supply";
  const isSupplyPending = approveTokenMutation.isPending || supplyCollateralMutation.isPending;

  const isBorrowInputEmpty = !borrowAmount || borrowAmount === "0";
  const isBorrowTooManyDecimals = hasTooManyDecimals(borrowAmount, market.loanTokenDecimals);
  const isBorrowOverMax = borrowAmountBI > maxBorrowableBI;
  const borrowButtonMessage = isBorrowInputEmpty
    ? "Enter borrow amount"
    : isBorrowTooManyDecimals
      ? "Too many decimals"
      : isBorrowOverMax
        ? "Exceeds max borrow"
        : "Borrow";
  const isBorrowPending = approveTokenMutation.isPending || borrowMutation.isPending;

  const handleSupply = async () => {
    if (isSupplyInputEmpty || isSupplyTooManyDecimals) return;
    
    try {
      const collateralTokenPath = market?.collateralToken;
      
      // UI approval buffer: convert string input to number of tokens for approval only
      const approvalAmount = Number(supplyAmount || "0") * 1.2
      
      await approveTokenMutation.mutateAsync({
        tokenPath: collateralTokenPath!,
        amount: approvalAmount
      });
            
      supplyCollateralMutation.mutate({
        marketId: market.poolPath!,
        amount: Number(supplyAmount || "0")
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['position', market.poolPath] });
          queryClient.invalidateQueries({ queryKey: ['loanAmount', market.poolPath] });
          queryClient.invalidateQueries({ queryKey: ['healthFactor', market.poolPath] });
          queryClient.invalidateQueries({ queryKey: ['market', market.poolPath] });
          reset();
        },
        onError: (error: Error) => {
          console.error(`Failed to supply collateral: ${error.message}`);
        }
      });
    } catch (error) {
      console.error(`Failed to approve token: ${(error as Error).message}`);
    }
  };

  const handleBorrow = async () => {
    if (isBorrowInputEmpty || isBorrowTooManyDecimals || isBorrowOverMax) return;
    
    try {
      const loanTokenPath = market?.loanToken;
      
      await approveTokenMutation.mutateAsync({
        tokenPath: loanTokenPath!,
        amount: Number(borrowAmount || "0")
      });
            
      borrowMutation.mutate({
        marketId: market.poolPath!,
        assets: Number(borrowAmount || "0")
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['position', market.poolPath] });
          queryClient.invalidateQueries({ queryKey: ['loanAmount', market.poolPath] });
          queryClient.invalidateQueries({ queryKey: ['healthFactor', market.poolPath] });
          queryClient.invalidateQueries({ queryKey: ['market', market.poolPath] });
          reset();
        },
        onError: (error: Error) => {
          console.error(`Failed to borrow: ${error.message}`);
        }
      });
    } catch (error) {
      console.error(`Failed to approve token: ${(error as Error).message}`);
    }
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
                onClick={() => {
                  setValue("borrowAmount", maxBorrowableStr);
                }}
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
        ltv={String(positionData?.ltv ?? 0)}
      />
    </form>
  )
} 
