"use client"

import { MarketInfo } from "@/app/types"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"

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
    const { register, watch } = useForm({
        defaultValues: {
            supplyAmount: "",
        }
        })
    const supplyAmount = watch("supplyAmount");
    return (
        <form className="space-y-4">
          {/* Supply Card */}
          <Card className={CARD_STYLES}>
            <CardHeader className="">
              <CardTitle className="text-gray-200 text-base font-medium">
                Supply {market.loanTokenSymbol}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                type="number"
                {...register("supplyAmount", { 
                  pattern: /^[0-9]*\.?[0-9]*$/
                })}
                className="text-4xl font-semibold text-gray-200 bg-transparent w-full border-none focus:outline-none p-0"
                placeholder="0.00"
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">${supplyValue.toFixed(2)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">0.00 {market.loanTokenSymbol}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-500 font-medium px-2 py-1 h-auto"
                  >
                    MAX
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
  
          {/* Submit Button */}
          <Button
            type="submit" 
            className="w-full shadow-lg text-gray-200 rounded-2xl bg-midnightPurple-900 hover:bg-gradient-to-tr hover:from-midnightPurple-900 hover:to-midnightPurple-800 transition-all duration-300 text-md relative overflow-hidden hover:before:absolute hover:before:inset-0 hover:before:bg-gradient-to-tr hover:before:from-transparent hover:before:to-white/5 hover:before:animate-shine"
            disabled={!supplyAmount || parseFloat(supplyAmount) <= 0}
          >
            {!supplyAmount || parseFloat(supplyAmount) <= 0
              ? "Enter Valid Amount" 
              : "Supply"}
          </Button>
        </form>
    )
} 
