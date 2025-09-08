import { MarketInfo } from "@/app/types";
import { HealthBar } from "@/components/health-bar";
import { Card, CardContent } from "@/components/ui/card";

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"

export interface PositionCardProps {
  market: MarketInfo
  supplyAmount: string
  borrowAmount: string
  repayAmount?: string
  withdrawAmount?: string
  maxBorrow: string
  isBorrowValid: boolean
  healthFactor: number
  currentCollateral: string
  currentBorrowAssets: string
}

export function PositionCard({
  market,
  supplyAmount,
  borrowAmount,
  repayAmount,
  withdrawAmount,
  currentCollateral,
  currentBorrowAssets,
  healthFactor,
}: PositionCardProps) {


  const supplyDelta = parseFloat(supplyAmount)
  const withdrawDelta = parseFloat(withdrawAmount || "0")
  const borrowDelta = parseFloat(borrowAmount)
  const repayDelta = parseFloat(repayAmount || "0")
  
  const projectedCollateral = parseFloat(currentCollateral) + supplyDelta - withdrawDelta
  const projectedLoan = parseFloat(currentBorrowAssets) + borrowDelta - repayDelta

  return (
    <Card className={CARD_STYLES}>
      <CardContent className="space-y-3 -mt-2">
        <div>
          <div className="text-sm text-gray-400">My collateral position ({market.collateralTokenSymbol})</div>
          <div className="text-xl font-semibold text-gray-200">
            {currentCollateral}
            {(supplyDelta > 0 || withdrawDelta > 0) && (
              <>
                {" "}
                <span className="text-gray-400">→</span>{" "}
                <span className="text-green-300">{projectedCollateral}</span>
              </>
            )}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400">My loan position ({market.loanTokenSymbol})</div>
          <div className="text-xl font-semibold text-gray-200">
            {currentBorrowAssets}
            {(borrowDelta > 0 || repayDelta > 0) && (
              <>
                {" "}
                <span className="text-gray-400">→</span>{" "}
                <span className="text-red-400">{projectedLoan}</span>
              </>
            )}
          </div>
        </div>
        
        <HealthBar healthFactor={healthFactor} />
      </CardContent>
    </Card>
  )
} 
