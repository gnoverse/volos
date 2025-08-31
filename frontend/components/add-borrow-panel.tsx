"use client"

import { useApproveTokenMutation, useBorrowMutation, useSupplyCollateralMutation } from "@/app/(app)/borrow/queries-mutations"
import { MarketInfo } from "@/app/types"
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
  supplyValue: number
  borrowValue: number
  healthFactor: string
  currentCollateral?: number
  currentLoan?: number
  ltv: string
  collateralTokenDecimals: number
  loanTokenDecimals: number
  positionData?: Position
}

export function AddBorrowPanel({
  market,
  supplyValue,
  borrowValue,
  healthFactor,
  currentCollateral = 0,
  currentLoan = 0,
  ltv,
  // collateralTokenDecimals,
  loanTokenDecimals,
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
  
  const positionCollateral = positionData?.collateral
    ? parseFloat(positionData.collateral)
    : currentCollateral;

  const positionLoan = positionData?.borrowShares
    ? parseFloat(positionData.borrowShares)
    : currentLoan;

  const supplyAmount = watch("supplyAmount");
  const borrowAmount = watch("borrowAmount");

  const supplyAmountNum = parseFloat(supplyAmount || "0")
  const totalCollateral = positionCollateral + supplyAmountNum
  const borrowAmountNum = parseFloat(borrowAmount || "0")
  const ltvFloat = parseFloat(ltv) / 1e18

  const maxBorrowable = Math.max(positionCollateral * ltvFloat - positionLoan, 0);

  const isSupplyInputEmpty = !supplyAmount || supplyAmount === "0";
  const supplyButtonMessage = isSupplyInputEmpty ? "Enter supply amount" : "Supply";
  const isSupplyPending = approveTokenMutation.isPending || supplyCollateralMutation.isPending;

  const isBorrowInputEmpty = !borrowAmount || borrowAmount === "0";
  const isBorrowOverMax = borrowAmountNum > maxBorrowable;
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
      const approvalAmount = parseFloat(supplyAmount);
      
      await approveTokenMutation.mutateAsync({
        tokenPath: collateralTokenPath!,
        amount: approvalAmount * Math.pow(10, 6) * 1.2 // 6 is just a mock for demo purposes, use collateralTokenDecimals
      });

      console.log("collateralTokenPath", collateralTokenPath)
      console.log("approvalAmount", approvalAmount)
      console.log("supplyAmount", supplyAmount)
      console.log("market.poolPath", market.poolPath)
            
      supplyCollateralMutation.mutate({
        marketId: market.poolPath!,
        amount: parseFloat(supplyAmount) * Math.pow(10, 6) // 6 is just a mock for demo purposes, use collateralTokenDecimals
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
      const approvalAmount = parseFloat(borrowAmount);
      
      await approveTokenMutation.mutateAsync({
        tokenPath: loanTokenPath!,
        amount: approvalAmount * Math.pow(10, loanTokenDecimals) * 1.2
      });
            
      borrowMutation.mutate({
        marketId: market.poolPath!,
        assets: parseFloat(borrowAmount) * Math.pow(10, loanTokenDecimals)
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
            <span className="text-xs text-gray-400">${(supplyValue * supplyAmountNum).toFixed(2)}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">0.00 {market.collateralTokenSymbol}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-blue-500 font-medium px-1 py-0 h-6"
                onClick={() => {
                  setValue("supplyAmount", maxBorrowable.toString());
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
            <span className="text-xs text-gray-400">${(borrowValue * borrowAmountNum).toFixed(2)}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">0.00 {market.loanTokenSymbol}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-blue-500 font-medium px-1 py-0 h-6"
                onClick={() => {
                  setValue("borrowAmount", maxBorrowable.toString());
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
        maxBorrowableAmount={totalCollateral * ltvFloat}
        isBorrowValid={borrowAmountNum <= maxBorrowable}
        healthFactor={healthFactor}
        currentCollateral={currentCollateral}
        currentLoan={currentLoan}
        ltv={ltv}
      />
    </form>
  )
} 
