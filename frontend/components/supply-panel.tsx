"use client"

import { useApproveTokenMutation, useSupplyMutation } from "@/app/(app)/borrow/queries-mutations"
import { MarketInfo } from "@/app/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl py-4"

interface SupplyPanelProps {
  market: MarketInfo
  supplyValue: number
  healthFactor: string
  currentCollateral?: number
  currentLoan?: number
  ltv: string
  collateralTokenDecimals: number
  loanTokenDecimals: number
}

export function SupplyPanel({
  market,
  supplyValue,
}: SupplyPanelProps) {
    const { register, watch, reset } = useForm({
        defaultValues: {
            supplyAmount: "",
        }
    })
    
    const queryClient = useQueryClient()
    const supplyMutation = useSupplyMutation()
    const approveTokenMutation = useApproveTokenMutation()
    
    const supplyAmount = watch("supplyAmount");
    const isSupplyInputEmpty = !supplyAmount || supplyAmount === "0";
    const isSupplyPending = approveTokenMutation.isPending || supplyMutation.isPending;
    const supplyButtonMessage = isSupplyInputEmpty ? "Enter supply amount" : "Supply";
    
    const handleSupply = async () => {
      if (isSupplyInputEmpty) return;
      
      try {
        const loanTokenPath = market?.loanToken;
        const approvalAmount = parseFloat(supplyAmount);
        
        await approveTokenMutation.mutateAsync({
          tokenPath: loanTokenPath!,
          amount: approvalAmount * 2
        });
              
        supplyMutation.mutate({
          marketId: market.poolPath!,
          assets: parseFloat(supplyAmount)
        }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['position', market.poolPath] });
            queryClient.invalidateQueries({ queryKey: ['loanAmount', market.poolPath] });
            queryClient.invalidateQueries({ queryKey: ['healthFactor', market.poolPath] });
            queryClient.invalidateQueries({ queryKey: ['market', market.poolPath] });
            reset();
          },
          onError: (error: Error) => {
            console.error(`Failed to supply: ${error.message}`);
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
                  Supply {market.loanTokenSymbol}
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
                <span className="text-xs text-gray-400">${(supplyValue * parseFloat(supplyAmount)).toFixed(2)}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">0.00 {market.loanTokenSymbol}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-500 font-medium px-1 py-0 h-6"
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
        </form>
    )
} 
