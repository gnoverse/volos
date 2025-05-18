"use client"

import { MarketInfo } from "@/app/types"
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
  healthFactor: string
  currentCollateral?: number
  currentLoan?: number
  watch: UseFormWatch<FormValues>
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
  handleSubmitAction,
  healthFactor,
  currentCollateral = 0,
  currentLoan = 0,
  watch
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-blue-500 font-medium px-2 py-1 h-auto"
                  onClick={handleMaxSupplyAction}
                >
                  MAX
                </Button>
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
          maxBorrowableAmount={maxBorrowableAmount}
          isBorrowValid={isBorrowValid}
          healthFactor={healthFactor}
          currentCollateral={currentCollateral}
          currentLoan={currentLoan}
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
          maxBorrowableAmount={maxBorrowableAmount}
          isBorrowValid={isBorrowValid}
          healthFactor={healthFactor}
          currentCollateral={currentCollateral}
          currentLoan={currentLoan}
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
  repayAmount?: string
  withdrawAmount?: string
  maxBorrowableAmount: number
  isBorrowValid: boolean
  healthFactor: string
  currentCollateral: number
  currentLoan: number
}

function PositionCard({
  market,
  supplyAmount,
  borrowAmount,
  repayAmount,
  withdrawAmount,
  currentCollateral,
  currentLoan,
  isBorrowValid,
  healthFactor
}: PositionCardProps) {
  const supplyDelta = parseFloat(supplyAmount || "0")
  const borrowDelta = parseFloat(borrowAmount || "0")
  const repayDelta = parseFloat(repayAmount || "0")
  const withdrawDelta = parseFloat(withdrawAmount || "0")

  const projectedCollateral = currentCollateral + supplyDelta - withdrawDelta
  const projectedLoan = currentLoan + borrowDelta - repayDelta

  return (
    <Card className={CARD_STYLES}>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm text-gray-400">My collateral position ({market.collateralTokenSymbol})</div>
          <div className="text-xl font-semibold text-gray-200">
            {currentCollateral.toFixed(2)}
            {(supplyDelta > 0 || withdrawDelta > 0) && (
              <>
                {" "}
                <span className="text-gray-400">→</span>{" "}
                <span className="text-green-300">{projectedCollateral.toFixed(0)}</span>
              </>
            )}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400">My loan position ({market.loanTokenSymbol})</div>
          <div className="text-xl font-semibold text-gray-200">
            {currentLoan.toFixed(2)}
            {(borrowDelta > 0 || repayDelta > 0) && (
              <>
                {" "}
                <span className="text-gray-400">→</span>{" "}
                <span className="text-red-400">{projectedLoan.toFixed(0)}</span>
              </>
            )}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400">Health Factor</div>
          <div className="text-xl font-semibold text-gray-200">
            {healthFactor}
          </div>
        </div>
        {borrowAmount && parseFloat(borrowAmount) > 0 && !isBorrowValid && (
          <div className="text-red-500 text-sm">
            Insufficient collateral for this borrow amount
          </div>
        )}
      </CardContent>
    </Card>
  )
} 