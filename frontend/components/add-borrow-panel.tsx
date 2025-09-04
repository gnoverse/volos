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

  const collateralDecimals = market.collateralTokenDecimals
  const loanDecimals = market.loanTokenDecimals

  const supplyAmountBI = toUnits(supplyAmount || "0", collateralDecimals)
  const borrowAmountBI = toUnits(borrowAmount || "0", loanDecimals)

  // totalCollateral = currentCollateral + supply
  // const totalCollateralBI = currentCollateralBI + supplyAmountBI // kept for future bigint precise flows

  // ltv is a float (0..1). Compute maxBorrowableNum for UI and validation only.
  const ltvFloat = positionData?.ltv || 0
  const currentCollateralNum = Number(fromUnits(currentCollateralBI, collateralDecimals))
  const supplyAmountNum = Number(fromUnits(supplyAmountBI, collateralDecimals))
  const totalCollateralNum = currentCollateralNum + supplyAmountNum
  const currentLoanNum = Number(fromUnits(currentLoanBI, loanDecimals))
  const borrowAmountNum = Number(fromUnits(borrowAmountBI, loanDecimals))
  const maxBorrowableNum = Math.max(0, totalCollateralNum * ltvFloat - currentLoanNum)

  const isSupplyInputEmpty = !supplyAmount || supplyAmount === "0";
  const supplyButtonMessage = isSupplyInputEmpty ? "Enter supply amount" : "Supply";
  const isSupplyPending = approveTokenMutation.isPending || supplyCollateralMutation.isPending;

  const isBorrowInputEmpty = !borrowAmount || borrowAmount === "0";
  const isBorrowOverMax = borrowAmountNum > maxBorrowableNum;
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
      
      // Use 20% buffer for approval (number in token units for UI/API)
      const approvalAmount = borrowAmountNum * 0 + Number((supplyAmount || "0")) * 1.2
      
      await approveTokenMutation.mutateAsync({
        tokenPath: collateralTokenPath!,
        amount: approvalAmount
      });

      // console logs removed
            
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
      
      // Use 20% buffer for approval (number in token units for UI/API)
      const approvalAmount = Number((borrowAmount || "0")) * 1.2
      
      await approveTokenMutation.mutateAsync({
        tokenPath: loanTokenPath!,
        amount: approvalAmount
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
            <span className="text-xs text-gray-400">{Number(supplyAmount || "0").toFixed(2)} {market.collateralTokenSymbol}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">{Number(fromUnits(currentCollateralBI, collateralDecimals)).toFixed(4)} {market.collateralTokenSymbol}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-blue-500 font-medium px-1 py-0 h-6"
                onClick={() => {
                  setValue("supplyAmount", maxBorrowableNum.toString());
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
            <span className="text-xs text-gray-400">{Number(borrowAmount || "0").toFixed(2)} {market.loanTokenSymbol}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">{Number(fromUnits(currentLoanBI, loanDecimals)).toFixed(4)} {market.loanTokenSymbol}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-blue-500 font-medium px-1 py-0 h-6"
                onClick={() => {
                  setValue("borrowAmount", maxBorrowableNum.toString());
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
        maxBorrowableAmount={maxBorrowableNum}
        isBorrowValid={borrowAmountNum <= maxBorrowableNum}
        healthFactor={"-"}
        currentCollateral={Number(fromUnits(currentCollateralBI, collateralDecimals))}
        currentLoan={Number(fromUnits(currentLoanBI, loanDecimals))}
        ltv={String(ltvFloat)}
      />
    </form>
  )
} 
