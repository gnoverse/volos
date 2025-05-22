import { MarketInfo } from "@/app/types";
import { formatNumber } from "@/app/utils/format.utils";
import { HealthBar } from "@/components/health-bar";
import { Card, CardContent } from "@/components/ui/card";

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"

export interface PositionCardProps {
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
  ltv?: string
}

export function PositionCard({
  market,
  supplyAmount,
  borrowAmount,
  repayAmount,
  withdrawAmount,
  currentCollateral,
  currentLoan,
  healthFactor,
}: PositionCardProps) {
  const supplyDelta = parseFloat(supplyAmount || "0")
  const borrowDelta = parseFloat(borrowAmount || "0")
  const repayDelta = parseFloat(repayAmount || "0")
  const withdrawDelta = parseFloat(withdrawAmount || "0")

  const projectedCollateral = currentCollateral + supplyDelta - withdrawDelta
  const projectedLoan = currentLoan + borrowDelta - repayDelta

  return (
    <Card className={CARD_STYLES}>
      <CardContent className="space-y-3 -mt-2">
        <div>
          <div className="text-sm text-gray-400">My collateral position ({market.collateralTokenSymbol})</div>
          <div className="text-xl font-semibold text-gray-200">
            {formatNumber(currentCollateral)}
            {(supplyDelta > 0 || withdrawDelta > 0) && (
              <>
                {" "}
                <span className="text-gray-400">→</span>{" "}
                <span className="text-green-300">{formatNumber(projectedCollateral)}</span>
              </>
            )}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400">My loan position ({market.loanTokenSymbol})</div>
          <div className="text-xl font-semibold text-gray-200">
            {formatNumber(currentLoan)}
            {(borrowDelta > 0 || repayDelta > 0) && (
              <>
                {" "}
                <span className="text-gray-400">→</span>{" "}
                <span className="text-red-400">{formatNumber(projectedLoan)}</span>
              </>
            )}
          </div>
        </div>
        
        <HealthBar healthFactor={healthFactor} />
      </CardContent>
    </Card>
  )
} 