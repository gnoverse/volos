"use client"

import { MarketInfo, Position } from "@/app/types"
import { formatPercentage, formatTokenAmount } from "@/app/utils/format.utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HealthBar } from "./health-bar"
import { PositionChartTabs } from "./position-chart-tabs"

interface MarketPositionProps {
  market: MarketInfo
  cardStyles: string
  healthFactor: string
  positionData?: Position
  caller: string
}

export function MyPosition({ 
  market, 
  cardStyles, 
  healthFactor, 
  positionData,
  caller
}: MarketPositionProps) {

  const hasPosition = positionData && (
    BigInt(positionData.collateral_supply) > BigInt(0) || 
    BigInt(positionData.borrow) > BigInt(0)
  )

  if (!hasPosition) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center text-gray-400 p-8">
        <div className="text-2xl mb-4">No Active Position</div>
        <p className="text-center max-w-md">
          You don&apos;t have any active positions in this market. Use the panel on the right to supply collateral and borrow assets.
        </p>
      </div>
    )
  }

  const currentBorrowShares = BigInt(positionData.borrow)
  const currentCollateralBigInt = BigInt(positionData.collateral_supply)
  const currentPriceBigInt = BigInt(market.currentPrice)
  const ltv = 0 //positionData.ltv

  return (
    <div className="space-y-6">
      {/* Position Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className={cardStyles}>
          <CardHeader className="">
            <CardTitle className="text-logo-600">Borrowed</CardTitle>
            <CardDescription className="text-gray-400">Your borrowed assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-200">
              {formatTokenAmount(positionData.borrow, market.loanTokenDecimals)} 
              <span className="text-gray-400 text-lg ml-2">{market.loanTokenSymbol}</span>
            </div>
            <div className="text-sm text-gray-400 mt-2 break-words">
              ≈ ${formatTokenAmount((currentBorrowShares * currentPriceBigInt).toString(), market.loanTokenDecimals + 18)} USD
            </div>
          </CardContent>
        </Card>

        <Card className={cardStyles}>
          <CardHeader className="">
            <CardTitle className="text-logo-600">Collateral</CardTitle>
            <CardDescription className="text-gray-400">Your supplied collateral</CardDescription>
          </CardHeader>
          <CardContent className="items-center">
            <div className="text-3xl font-bold text-gray-200 flex flex-wrap items-baseline break-all ">
              <span className="break-all mr-2">
                {formatTokenAmount(positionData.collateral_supply, market.collateralTokenDecimals)}
              </span>
              <span className="text-gray-400 text-lg">{market.collateralTokenSymbol}</span>
            </div>
            <div className="text-sm text-gray-400 mt-2 break-words">
              ≈ ${formatTokenAmount((currentCollateralBigInt * currentPriceBigInt).toString(), market.collateralTokenDecimals + 18)} USD
            </div>
          </CardContent>
        </Card>

        <Card className={cardStyles}>
          <CardHeader className="">
            <CardTitle className="text-logo-600">Health</CardTitle>
            <CardDescription className="text-gray-400">Position health metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Current LTV</div>
                <div className="text-xl font-medium text-gray-200">
                  {formatPercentage(ltv)}<span className="text-gray-400 text-sm">/ {formatPercentage(market.lltv)}</span>
                </div>
              </div>
              
                <HealthBar healthFactor={healthFactor} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Position History Chart with Tabs */}
      <PositionChartTabs caller={caller} market={market} marketId={market.poolPath || ''} cardStyles={cardStyles} />
    </div>
  )
} 
