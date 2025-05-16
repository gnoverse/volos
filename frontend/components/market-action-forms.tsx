"use client"

import { MarketInfo } from "@/app/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { UseFormHandleSubmit, UseFormRegister, UseFormSetValue } from "react-hook-form"
import { formatUnits } from "viem"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"

type FormValues = {
  supplyAmount: string
  borrowAmount: string
  repayAmount: string
  withdrawAmount: string
}

interface MarketActionFormsProps {
  market: MarketInfo
  formType: "add-borrow" | "repay-withdraw" | "supply-only"
  onSubmitAction: (data: FormValues) => void
  supplyAmount: string
  borrowAmount: string
  supplyValue: number
  borrowValue: number
  maxBorrowableAmount: number
  isBorrowValid: boolean
  isTransactionValid: boolean
  isTransactionPending: boolean
  handleMaxSupplyAction: () => void
  handleMaxBorrowAction: () => void
  registerAction: UseFormRegister<FormValues>
  setValue: UseFormSetValue<FormValues>
  handleSubmitAction: UseFormHandleSubmit<FormValues>
}

export function MarketActionForms({
  market,
  formType,
  onSubmitAction,
  supplyAmount,
  borrowAmount,
  supplyValue,
  borrowValue,
  maxBorrowableAmount,
  isBorrowValid,
  isTransactionValid,
  isTransactionPending,
  handleMaxSupplyAction,
  handleMaxBorrowAction,
  registerAction,
  handleSubmitAction
}: MarketActionFormsProps) {
  
  if (formType === "add-borrow") {
    return (
      <form onSubmit={handleSubmitAction(onSubmitAction)} className="space-y-4">
        {/* Supply Card */}
        <Card className={CARD_STYLES}>
          <CardHeader className="">
            <CardTitle className="text-gray-200 text-base font-medium">
              Supply Collateral {market.collateralTokenSymbol}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              type="number"
              {...registerAction("supplyAmount", { 
                pattern: /^[0-9]*\.?[0-9]*$/
              })}
              className="text-4xl font-semibold text-gray-200 bg-transparent w-full border-none focus:outline-none p-0"
              placeholder="0.00"
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">${supplyValue.toFixed(2)}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">0.00 {market.collateralTokenSymbol}</span>
                <button 
                  type="button" 
                  className="text-xs text-blue-500 font-medium"
                  onClick={handleMaxSupplyAction}
                >
                  MAX
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Borrow Card */}
        <Card className={CARD_STYLES}>
          <CardHeader className="">
            <CardTitle className="text-gray-200 text-base font-medium">
              Borrow {market.loanTokenSymbol}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              type="number"
              {...registerAction("borrowAmount", { 
                pattern: /^[0-9]*\.?[0-9]*$/
              })}
              className="text-4xl font-semibold text-gray-200 bg-transparent w-full border-none focus:outline-none p-0"
              placeholder="0.00"
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">${borrowValue.toFixed(2)}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">0.00 {market.loanTokenSymbol}</span>
                <button 
                  type="button" 
                  className="text-xs text-blue-500 font-medium"
                  onClick={handleMaxBorrowAction}
                >
                  MAX
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Position Card */}
        <PositionCard 
          market={market}
          supplyAmount={supplyAmount}
          borrowAmount={borrowAmount}
          maxBorrowableAmount={maxBorrowableAmount}
          isBorrowValid={isBorrowValid}
        />

        {/* Submit Button */}
        <Button
          type="submit" 
          className="w-full shadow-lg text-gray-200 rounded-2xl bg-midnightPurple-900 hover:bg-gradient-to-tr hover:from-midnightPurple-900 hover:to-midnightPurple-800 transition-all duration-300 text-md relative overflow-hidden hover:before:absolute hover:before:inset-0 hover:before:bg-gradient-to-tr hover:before:from-transparent hover:before:to-white/5 hover:before:animate-shine"
          disabled={!isTransactionValid || isTransactionPending}
        >
          {isTransactionPending 
            ? "Processing..." 
            : (!isTransactionValid 
                ? borrowAmount && parseFloat(borrowAmount) > 0 && !isBorrowValid
                  ? "Insufficient Collateral"
                  : "Enter Valid Amount" 
                : "Submit Transaction")}
        </Button>
      </form>
    )
  } else if (formType === "repay-withdraw") {
    return (
      <form onSubmit={handleSubmitAction(onSubmitAction)} className="space-y-4">
        {/* Repay Card */}
        <Card className={CARD_STYLES}>
          <CardHeader className="">
            <CardTitle className="text-gray-200 text-base font-medium">
              Repay Loan {market.loanTokenSymbol}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              type="number"
              {...registerAction("repayAmount", { 
                pattern: /^[0-9]*\.?[0-9]*$/
              })}
              className="text-4xl font-semibold text-gray-200 bg-transparent w-full border-none focus:outline-none p-0"
              placeholder="0.00"
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">$0.00</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">0.00 {market.loanTokenSymbol}</span>
                <button 
                  type="button" 
                  className="text-xs text-blue-500 font-medium"
                >
                  MAX
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdraw Card */}
        <Card className={CARD_STYLES}>
          <CardHeader className="">
            <CardTitle className="text-gray-200 text-base font-medium">
              Withdraw Collateral {market.collateralTokenSymbol}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              type="number"
              {...registerAction("withdrawAmount", { 
                pattern: /^[0-9]*\.?[0-9]*$/
              })}
              className="text-4xl font-semibold text-gray-200 bg-transparent w-full border-none focus:outline-none p-0"
              placeholder="0.00"
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">$0.00</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">0.00 {market.collateralTokenSymbol}</span>
                <button 
                  type="button" 
                  className="text-xs text-blue-500 font-medium"
                >
                  MAX
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Position Card */}
        <PositionCard 
          market={market}
          supplyAmount={supplyAmount}
          borrowAmount={borrowAmount}
          maxBorrowableAmount={maxBorrowableAmount}
          isBorrowValid={isBorrowValid}
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
  } else {
    return (
      <form onSubmit={handleSubmitAction(onSubmitAction)} className="space-y-4">
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
              {...registerAction("supplyAmount", { 
                pattern: /^[0-9]*\.?[0-9]*$/
              })}
              className="text-4xl font-semibold text-gray-200 bg-transparent w-full border-none focus:outline-none p-0"
              placeholder="0.00"
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">${supplyValue.toFixed(2)}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">0.00 {market.loanTokenSymbol}</span>
                <button 
                  type="button" 
                  className="text-xs text-blue-500 font-medium"
                  onClick={handleMaxSupplyAction}
                >
                  MAX
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit" 
          className="w-full shadow-lg text-gray-200 rounded-2xl bg-midnightPurple-900 hover:bg-gradient-to-tr hover:from-midnightPurple-900 hover:to-midnightPurple-800 transition-all duration-300 text-md relative overflow-hidden hover:before:absolute hover:before:inset-0 hover:before:bg-gradient-to-tr hover:before:from-transparent hover:before:to-white/5 hover:before:animate-shine"
          disabled={!supplyAmount || parseFloat(supplyAmount) <= 0 || isTransactionPending}
        >
          {isTransactionPending 
            ? "Processing..." 
            : (!supplyAmount || parseFloat(supplyAmount) <= 0
                ? "Enter Valid Amount" 
                : "Supply")}
        </Button>
      </form>
    )
  }
}

interface PositionCardProps {
  market: MarketInfo
  supplyAmount: string
  borrowAmount: string
  maxBorrowableAmount: number
  isBorrowValid: boolean
}

function PositionCard({ market, supplyAmount, borrowAmount, maxBorrowableAmount, isBorrowValid }: PositionCardProps) {
  return (
    <Card className={CARD_STYLES}>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm text-gray-400">My collateral position ({market.collateralTokenSymbol})</div>
          <div className="text-xl font-semibold text-gray-200">0.00</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400">My loan position ({market.loanTokenSymbol})</div>
          <div className="text-xl font-semibold text-gray-200">0.00</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400">LTV / Liquidation LTV</div>
          <div className="text-xl font-semibold text-gray-200">
            {borrowAmount && supplyAmount ? 
              ((parseFloat(borrowAmount) / (parseFloat(supplyAmount) * Number(formatUnits(BigInt(market.currentPrice || "0"), 18)))) * 100).toFixed(2) : 
              "0"}% / {(Number(formatUnits(BigInt(market.lltv), 18)) * 100).toFixed(0)}%
          </div>
          
          <div className="mt-2 relative">
            <div className="h-2 bg-gray-600 rounded-full w-full"></div>
            <div 
              className={`absolute left-0 top-0 h-full ${borrowAmount && supplyAmount ? 'bg-blue-500' : ''} rounded-full`} 
              style={{ 
                width: borrowAmount && supplyAmount ? 
                  `${Math.min(100, (parseFloat(borrowAmount) / (parseFloat(supplyAmount) * Number(formatUnits(BigInt(market.currentPrice || "0"), 18)))) / (Number(formatUnits(BigInt(market.lltv), 18))) * 100)}%` : 
                  '0%',
                opacity: borrowAmount && supplyAmount ? 1 : 0
              }}
            >
              <div className="absolute right-0 -top-1 h-4 w-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
        
        {borrowAmount && parseFloat(borrowAmount) > 0 && !isBorrowValid && (
          <div className="text-red-500 text-sm">
            Insufficient collateral for this borrow amount
          </div>
        )}
        
        {supplyAmount && parseFloat(supplyAmount) > 0 && (
          <div className="text-gray-400 text-sm">
            Max borrowable: {maxBorrowableAmount.toFixed(2)} {market.loanTokenSymbol}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 