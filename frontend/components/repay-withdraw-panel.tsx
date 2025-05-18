"use client"

import { MarketInfo } from "@/app/types"
import { PositionCard } from "@/components/position-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { UseFormHandleSubmit, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"

type FormValues = {
  supplyAmount: string
  borrowAmount: string
  repayAmount: string
  withdrawAmount: string
}

interface RepayWithdrawPanelProps {
  market: MarketInfo
  onSubmitAction: (data: FormValues) => void
  supplyAmount: string
  borrowAmount: string
  supplyValue: number
  borrowValue: number
  isTransactionPending: boolean
  handleMaxSupplyAction: () => void
  handleMaxBorrowAction: () => void
  registerAction: UseFormRegister<FormValues>
  setValue: UseFormSetValue<FormValues>
  handleSubmitAction: UseFormHandleSubmit<FormValues>
  healthFactor: string
  currentCollateral?: number
  currentLoan?: number
  watch: UseFormWatch<FormValues>
  ltv: string
  collateralTokenDecimals: number
  loanTokenDecimals: number
}

export function RepayWithdrawPanel({
  market,
  onSubmitAction,
  supplyAmount,
  borrowAmount,
  handleMaxBorrowAction,
  registerAction,
  handleSubmitAction,
  healthFactor,
  currentCollateral = 0,
  currentLoan = 0,
  watch,
  ltv,
}: RepayWithdrawPanelProps) {
  const supplyAmountNum = parseFloat(supplyAmount || "0")
  const borrowAmountNum = parseFloat(borrowAmount || "0")
  const ltvFloat = parseFloat(ltv) / 1e18

  return (
    <form onSubmit={handleSubmitAction(onSubmitAction)} className="space-y-4">
      {/* Repay Card */}
      <Card className={CARD_STYLES}>
        <CardHeader>
          <CardTitle className="text-gray-200 text-base font-medium">
            Repay Loan {market.loanTokenSymbol}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            type="number"
            {...registerAction("repayAmount", { pattern: /^[0-9]*\.?[0-9]*$/ })}
            className="text-4xl font-semibold text-gray-200 bg-transparent w-full border-none focus:outline-none p-0"
            placeholder="0.00"
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">$0.00</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">0.00 {market.loanTokenSymbol}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-blue-500 font-medium px-2 py-1 h-auto"
                onClick={handleMaxBorrowAction}
              >
                MAX
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdraw Card */}
      <Card className={CARD_STYLES}>
        <CardHeader>
          <CardTitle className="text-gray-200 text-base font-medium">
            Withdraw Collateral {market.collateralTokenSymbol}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            type="number"
            {...registerAction("withdrawAmount", { pattern: /^[0-9]*\.?[0-9]*$/ })}
            className="text-4xl font-semibold text-gray-200 bg-transparent w-full border-none focus:outline-none p-0"
            placeholder="0.00"
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">$0.00</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">0.00 {market.collateralTokenSymbol}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-blue-500 font-medium px-2 py-1 h-auto"
                onClick={handleMaxBorrowAction}
              >
                MAX
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position Card */}
      <PositionCard 
        market={market}
        supplyAmount={supplyAmount}
        borrowAmount={borrowAmount}
        repayAmount={watch("repayAmount") || ""}
        withdrawAmount={watch("withdrawAmount") || ""}
        maxBorrowableAmount={supplyAmountNum * ltvFloat}
        isBorrowValid={true}
        healthFactor={healthFactor}
        currentCollateral={currentCollateral}
        currentLoan={currentLoan}
        ltv={ltv}
      />

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full shadow-lg text-gray-200 rounded-2xl bg-midnightPurple-900 hover:bg-gradient-to-tr hover:from-midnightPurple-900 hover:to-midnightPurple-800 transition-all duration-300 text-md relative overflow-hidden hover:before:absolute hover:before:inset-0 hover:before:bg-gradient-to-tr hover:before:from-transparent hover:before:to-white/5 hover:before:animate-shine"
        disabled={true}
      >
        Enter Valid Amount
      </Button>
    </form>
  )
} 