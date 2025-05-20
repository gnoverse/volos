"use client"

import { MarketInfo, Position } from "@/app/types"
import { PositionCard } from "@/components/position-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"

type FormValues = {
  supplyAmount: string
  borrowAmount: string
  repayAmount: string
  withdrawAmount: string
}

interface AddBorrowPanelProps {
  market: MarketInfo
  supplyValue: number
  borrowValue: number
  onSubmitAction: (data: FormValues) => void
  isTransactionPending: boolean
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
  onSubmitAction,
  healthFactor,
  currentCollateral = 0,
  currentLoan = 0,
  ltv,
  positionData,
}: AddBorrowPanelProps) {

    const { register, handleSubmit, setValue, watch, reset } = useForm({
        defaultValues: {
            supplyAmount: "",
            borrowAmount: "",
            repayAmount: "",
            withdrawAmount: ""
        }
        })
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

  const isBorrowInputEmpty = !borrowAmount || borrowAmount === "0";
  const isBorrowOverMax = borrowAmountNum > maxBorrowable;
  const borrowButtonMessage = isBorrowInputEmpty
    ? "Enter borrow amount"
    : isBorrowOverMax
      ? "Exceeds max borrow"
      : "Borrow";

  return (
    <form onSubmit={handleSubmit(onSubmitAction)} className="space-y-4">

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
      {/* Supply Card */}
      <Card className={CARD_STYLES}>
        <CardHeader>
          <CardTitle className="text-gray-200 text-base font-medium">
            Supply Collateral {market.collateralTokenSymbol}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            type="number"
            {...register("supplyAmount", { pattern: /^[0-9]*\.?[0-9]*$/ })}
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
            className="w-full mt-2"
            disabled={isSupplyInputEmpty}
            onClick={() => {
              if (!isSupplyInputEmpty) {
                onSubmitAction({ supplyAmount: "", borrowAmount: "", repayAmount: "", withdrawAmount: "" });
              }
            }}
          >
            {supplyButtonMessage}
          </Button>
        </CardContent>
      </Card>

      {/* Borrow Card */}
      <Card className={CARD_STYLES}>
        <CardHeader>
          <CardTitle className="text-gray-200 text-base font-medium">
            Borrow {market.loanTokenSymbol}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            type="number"
            {...register("borrowAmount", { pattern: /^[0-9]*\.?[0-9]*$/ })}
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
            className="w-full mt-2"
            disabled={isBorrowInputEmpty || isBorrowOverMax}
            onClick={() => {
              if (!isBorrowInputEmpty && !isBorrowOverMax) {
                onSubmitAction({ supplyAmount: "", borrowAmount: "", repayAmount: "", withdrawAmount: "" });
                reset();
              }
            }}
          >
            {borrowButtonMessage}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
} 