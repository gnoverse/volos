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

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl py-4"

interface AddBorrowPanelProps {
  market: MarketInfo
  positionData: Position
}

export function AddBorrowPanel({
  market,
  positionData,
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
  
  const currentCollateralBI = BigInt(positionData?.collateral_supply || "0")
  const currentLoanBI = BigInt(positionData?.loan || "0")

  const supplyAmount = watch("supplyAmount");
  const borrowAmount = watch("borrowAmount");

  // Helpers to convert UI input <-> bigint precisely
  const toUnits = (v: string, decimals: number): bigint => {
    const [intPart, fracRaw] = (v || "0").split(".")
    const frac = (fracRaw || "").slice(0, decimals).padEnd(decimals, "0")
    const cleaned = (intPart || "0").replace(/\D/g, "")
    return BigInt(cleaned || "0") * BigInt(10) ** BigInt(decimals) + BigInt(frac || "0")
  }
  const fromUnits = (bi: bigint, decimals: number): string => {
    const d = BigInt(decimals)
    const base = BigInt(10) ** d
    const intPart = bi / base
    const fracPart = (bi % base).toString().padStart(decimals, '0')
    return `${intPart}.${fracPart}`
  }
  const formatUnits = (bi: bigint, decimals: number, fractionDigits: number): string => {
    const full = fromUnits(bi, decimals)
    const [i, f = ""] = full.split(".")
    return fractionDigits > 0 ? `${i}.${f.slice(0, fractionDigits)}` : i
  }

  const supplyAmountBI = toUnits(supplyAmount || "0", market.collateralTokenDecimals)
  const borrowAmountBI = toUnits(borrowAmount || "0", market.loanTokenDecimals)

  // LTV as scaled integer to avoid float math (fallback until API provides ltv_scaled)
  const LTV_SCALE = BigInt(1_000_000_000) // 1e9
  const ltvScaled: bigint = BigInt(Math.round((positionData?.ltv ?? 0) * Number(LTV_SCALE)))

  const totalCollateralBI = currentCollateralBI + supplyAmountBI
  // maxBorrowable = totalCollateral * ltv - currentLoan, in loan token denom units
  let maxBorrowableBI = (totalCollateralBI * ltvScaled) / LTV_SCALE - currentLoanBI
  if (maxBorrowableBI < BigInt(0)) maxBorrowableBI = BigInt(0)

  // Display strings (no Number casting)
  const supplyAmountDisplay = supplyAmount || "0"
  const currentCollateralStr = formatUnits(currentCollateralBI, market.collateralTokenDecimals, 4)
  const currentLoanStr = formatUnits(currentLoanBI, market.loanTokenDecimals, 4)
  const maxBorrowableStr = formatUnits(maxBorrowableBI, market.loanTokenDecimals, 4)

  const isSupplyInputEmpty = !supplyAmount || supplyAmount === "0";
  const supplyButtonMessage = isSupplyInputEmpty ? "Enter supply amount" : "Supply";
  const isSupplyPending = approveTokenMutation.isPending || supplyCollateralMutation.isPending;

  const isBorrowInputEmpty = !borrowAmount || borrowAmount === "0";
  const isBorrowOverMax = borrowAmountBI > maxBorrowableBI;
  const borrowButtonMessage = isBorrowInputEmpty
    ? "Enter borrow amount"
    : isBorrowOverMax
      ? "Exceeds max borrow"
      : "Borrow";
  const isBorrowPending = approveTokenMutation.isPending || borrowMutation.isPending;

  const handleSupply = async () => {
    if (isSupplyInputEmpty) return;
    
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
    if (isBorrowInputEmpty || isBorrowOverMax) return;
    
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
            disabled={isSupplyInputEmpty || isSupplyPending}
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
            disabled={isBorrowInputEmpty || isBorrowOverMax || isBorrowPending}
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
