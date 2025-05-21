"use client"

import { useApproveTokenMutation, useRepayMutation, useWithdrawCollateralMutation } from "@/app/(app)/borrow/queries-mutations"
import { MarketInfo, Position } from "@/app/types"
import { PositionCard } from "@/components/position-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowUp, Minus } from "lucide-react"
import { useForm } from "react-hook-form"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl py-4"

interface RepayWithdrawPanelProps {
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

export function RepayWithdrawPanel({
  market,
  supplyValue,
  borrowValue,
  healthFactor,
  currentCollateral = 0,
  currentLoan = 0,
  ltv,
  positionData,
}: RepayWithdrawPanelProps) {
  const ltvFloat = parseFloat(ltv) / 1e18
  const { register, setValue, watch, reset } = useForm({
    defaultValues: {
      repayAmount: "",
      withdrawAmount: ""
    }
  })
  
  const queryClient = useQueryClient()
  const repayMutation = useRepayMutation()
  const withdrawCollateralMutation = useWithdrawCollateralMutation()
  const approveTokenMutation = useApproveTokenMutation()
  
  const positionCollateral = positionData?.collateral
    ? parseFloat(positionData.collateral)
    : currentCollateral;

  const positionLoan = positionData?.borrowShares
    ? parseFloat(positionData.borrowShares)
    : currentLoan;

  const repayAmount = watch("repayAmount");
  const withdrawAmount = watch("withdrawAmount");

  const repayAmountNum = parseFloat(repayAmount || "0")
  const withdrawAmountNum = parseFloat(withdrawAmount || "0")
  
  const remainingLoan = Math.max(positionLoan - repayAmountNum, 0);
  const remainingCollateral = Math.max(positionCollateral - withdrawAmountNum, 0);
  
  const maxWithdrawable = Math.max(positionCollateral - (remainingLoan / ltvFloat), 0);
  const isWithdrawOverMax = withdrawAmountNum > maxWithdrawable || withdrawAmountNum > positionCollateral;
  
  const isRepayInputEmpty = !repayAmount || repayAmount === "0";
  const isRepayOverMax = repayAmountNum > positionLoan;
  const repayButtonMessage = isRepayInputEmpty 
    ? "Enter repay amount" 
    : isRepayOverMax 
      ? "Exceeds loan amount" 
      : "Repay";
  const isRepayPending = approveTokenMutation.isPending || repayMutation.isPending;

  const isWithdrawInputEmpty = !withdrawAmount || withdrawAmount === "0";
  const withdrawButtonMessage = isWithdrawInputEmpty 
    ? "Enter withdraw amount" 
    : isWithdrawOverMax 
      ? "Exceeds max withdrawable" 
      : "Withdraw";
  const isWithdrawPending = approveTokenMutation.isPending || withdrawCollateralMutation.isPending;

  const handleRepay = async () => {
    if (isRepayInputEmpty || isRepayOverMax) return;
    
    try {
      const loanTokenPath = market?.loanToken;
      const approvalAmount = parseFloat(repayAmount);
      
      await approveTokenMutation.mutateAsync({
        tokenPath: loanTokenPath!,
        amount: approvalAmount * 2
      });
            
      repayMutation.mutate({
        marketId: market.poolPath!,
        assets: parseFloat(repayAmount)
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['position', market.poolPath] });
          queryClient.invalidateQueries({ queryKey: ['loanAmount', market.poolPath] });
          queryClient.invalidateQueries({ queryKey: ['healthFactor', market.poolPath] });
          queryClient.invalidateQueries({ queryKey: ['market', market.poolPath] });
          reset();
        },
        onError: (error: Error) => {
          console.error(`Failed to repay loan: ${error.message}`);
        }
      });
    } catch (error) {
      console.error(`Failed to approve token: ${(error as Error).message}`);
    }
  };

  const handleWithdraw = async () => {
    if (isWithdrawInputEmpty || isWithdrawOverMax) return;
    
    try {
      withdrawCollateralMutation.mutate({
        marketId: market.poolPath!,
        amount: parseFloat(withdrawAmount)
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['position', market.poolPath] });
          queryClient.invalidateQueries({ queryKey: ['loanAmount', market.poolPath] });
          queryClient.invalidateQueries({ queryKey: ['healthFactor', market.poolPath] });
          queryClient.invalidateQueries({ queryKey: ['market', market.poolPath] });
          reset();
        },
        onError: (error: Error) => {
          console.error(`Failed to withdraw collateral: ${error.message}`);
        }
      });
    } catch (error) {
      console.error(`Failed to withdraw: ${(error as Error).message}`);
    }
  };

  return (
    <form className="space-y-3">
      {/* Repay Card */}
      <Card className={CARD_STYLES}>
        <CardHeader className="px-4 -mb-4">
          <div className="flex items-center gap-2">
            <ArrowUp size={16} className="text-blue-400" />
            <CardTitle className="text-gray-200 text-sm font-medium mb-0">
              Repay Loan {market.loanTokenSymbol}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-1 pt-0 px-4">
          <Input
            type="number"
            {...register("repayAmount", { pattern: /^[0-9]*\.?[0-9]*$/ })}
            className="text-3xl font-semibold text-gray-200 bg-transparent w-full border-none focus:outline-none p-0"
            placeholder="0.00"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">${(parseFloat(repayAmount || "0") * borrowValue).toFixed(2)}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">{positionLoan.toFixed(2)} {market.loanTokenSymbol}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-blue-500 font-medium px-1 py-0 h-6"
                onClick={() => {
                  setValue("repayAmount", positionLoan.toString());
                }}
              >
                MAX
              </Button>
            </div>
          </div>
          <Button
            type="button"
            className="w-full mt-1 bg-midnightPurple-800 hover:bg-midnightPurple-900/70 h-8 text-sm"
            disabled={isRepayInputEmpty || isRepayOverMax || isRepayPending}
            onClick={handleRepay}
          >
            {isRepayPending ? "Processing..." : repayButtonMessage}
          </Button>
        </CardContent>
      </Card>

      {/* Withdraw Card */}
      <Card className={CARD_STYLES}>
        <CardHeader className="px-4 -mb-4">
          <div className="flex items-center gap-2">
            <Minus size={16} className="text-purple-400" />
            <CardTitle className="text-gray-200 text-sm font-medium mb-0">
              Withdraw Collateral {market.collateralTokenSymbol}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-1 pt-0 px-4">
          <Input
            type="number"
            {...register("withdrawAmount", { pattern: /^[0-9]*\.?[0-9]*$/ })}
            className="text-3xl font-semibold text-gray-200 bg-transparent w-full border-none focus:outline-none p-0"
            placeholder="0.00"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">${(parseFloat(withdrawAmount || "0") * supplyValue).toFixed(2)}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">{positionCollateral.toFixed(2)} {market.collateralTokenSymbol}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-blue-500 font-medium px-1 py-0 h-6"
                onClick={() => {
                  setValue("withdrawAmount", maxWithdrawable.toString());
                }}
              >
                MAX
              </Button>
            </div>
          </div>
          <Button
            type="button"
            className="w-full mt-1 bg-midnightPurple-800 hover:bg-midnightPurple-900/70 h-8 text-sm"
            disabled={isWithdrawInputEmpty || isWithdrawOverMax || isWithdrawPending}
            onClick={handleWithdraw}
          >
            {isWithdrawPending ? "Processing..." : withdrawButtonMessage}
          </Button>
        </CardContent>
      </Card>

      {/* Position Card */}
      <PositionCard 
        market={market}
        supplyAmount={""}
        borrowAmount={""}
        repayAmount={repayAmount}
        withdrawAmount={withdrawAmount}
        maxBorrowableAmount={remainingCollateral * ltvFloat}
        isBorrowValid={!isWithdrawOverMax && !isRepayOverMax}
        healthFactor={healthFactor}
        currentCollateral={currentCollateral}
        currentLoan={currentLoan}
        ltv={ltv}
      />
    </form>
  )
} 
