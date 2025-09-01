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
import { 
  parseUint256, 
  addUint256, 
  subtractUint256, 
  multiplyUint256ByNumber,
  uint256ToNumber
} from "@/app/utils/uint256.utils"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl py-4"

interface AddBorrowPanelProps {
  market: MarketInfo
  supplyValue: string // Changed from number to string (uint256)
  borrowValue: string // Changed from number to string (uint256)
  healthFactor: string
  currentCollateral?: string // Changed from number to string (uint256)
  currentLoan?: string // Changed from number to string (uint256)
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
  currentCollateral = "0",
  currentLoan = "0",
  ltv,
  // collateralTokenDecimals,
  // loanTokenDecimals,
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
  
  // Get current positions as uint256 strings
  const positionCollateral = positionData?.collateral || currentCollateral;
  const positionLoan = positionData?.borrowShares || currentLoan;

  const supplyAmount = watch("supplyAmount");
  const borrowAmount = watch("borrowAmount");

  // Convert user input to uint256 strings
  const supplyAmountUint256 = supplyAmount ? parseUint256(supplyAmount, 6) : "0"; // Using 6 decimals for demo
  const borrowAmountUint256 = borrowAmount ? parseUint256(borrowAmount, 6) : "0"; // Using 6 decimals for demo
  
  // Calculate total collateral after supply
  const totalCollateral = addUint256(positionCollateral, supplyAmountUint256);
  
  // Convert LTV to number for calculation (it's already in WAD format)
  const ltvFloat = uint256ToNumber(ltv, 18);
  
  // Calculate max borrowable: (totalCollateral * ltv) - currentLoan
  const maxBorrowableCollateral = multiplyUint256ByNumber(totalCollateral, ltvFloat);
  const maxBorrowable = subtractUint256(maxBorrowableCollateral, positionLoan);
  
  // Convert to numbers for display and comparison
  const supplyAmountNum = uint256ToNumber(supplyAmountUint256, 6);
  const borrowAmountNum = uint256ToNumber(borrowAmountUint256, 6);
  const maxBorrowableNum = uint256ToNumber(maxBorrowable, 6);

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
      
      // Use uint256 string for approval amount (with 20% buffer)
      const approvalAmountUint256 = multiplyUint256ByNumber(supplyAmountUint256, 1.2);
      
      await approveTokenMutation.mutateAsync({
        tokenPath: collateralTokenPath!,
        amount: uint256ToNumber(approvalAmountUint256, 6)
      });

      console.log("collateralTokenPath", collateralTokenPath)
      console.log("supplyAmountUint256", supplyAmountUint256)
      console.log("supplyAmount", supplyAmount)
      console.log("market.poolPath", market.poolPath)
            
      supplyCollateralMutation.mutate({
        marketId: market.poolPath!,
        amount: uint256ToNumber(supplyAmountUint256, 6)
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
      
      // Use uint256 string for approval amount (with 20% buffer)
      const approvalAmountUint256 = multiplyUint256ByNumber(borrowAmountUint256, 1.2);
      
      await approveTokenMutation.mutateAsync({
        tokenPath: loanTokenPath!,
        amount: uint256ToNumber(approvalAmountUint256, 6)
      });
            
      borrowMutation.mutate({
        marketId: market.poolPath!,
        assets: uint256ToNumber(borrowAmountUint256, 6)
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
            <span className="text-xs text-gray-400">${(uint256ToNumber(supplyValue, 6) * supplyAmountNum).toFixed(2)}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">0.00 {market.collateralTokenSymbol}</span>
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
            <span className="text-xs text-gray-400">${(borrowValue * borrowAmountNum).toFixed(2)}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">0.00 {market.loanTokenSymbol}</span>
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
        healthFactor={healthFactor}
        currentCollateral={uint256ToNumber(currentCollateral, 6)}
        currentLoan={uint256ToNumber(currentLoan, 6)}
        ltv={ltv}
      />
    </form>
  )
} 
