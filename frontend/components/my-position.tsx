"use client"

import { PositionHistory, getPositionHistoryForMarket } from "@/app/(app)/borrow/mock-history"
import { MarketInfo, Position } from "@/app/types"
import { formatHealthFactor, formatLTV, formatTokenAmount } from "@/app/utils/format.utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { PositionChartTabs } from "./position-chart-tabs"

interface MarketPositionProps {
  market: MarketInfo
  cardStyles: string
  healthFactor: string
  currentCollateral: number
  currentLoan: number
  positionData?: Position | null
}

export function MyPosition({ 
  market, 
  cardStyles, 
  healthFactor, 
  currentCollateral, 
  currentLoan,
  positionData
}: MarketPositionProps) {
  const [positionHistory, setPositionHistory] = useState<PositionHistory[]>([])
  
  useEffect(() => {
    const history = getPositionHistoryForMarket(market.marketId || `${market.collateralTokenSymbol.toLowerCase()}:${market.loanTokenSymbol.toLowerCase()}:3000`)
    setPositionHistory(history)
  }, [market])

  const hasPosition = positionData && (
    parseFloat(positionData.collateral) > 0 || 
    parseFloat(positionData.borrowShares) > 0
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

  const ltv = currentLoan > 0 && currentCollateral > 0 
    ? (currentLoan / (currentCollateral * parseFloat(formatTokenAmount(market.currentPrice, 18)))) * 100 
    : 0

  const healthFactorValue = parseFloat(formatHealthFactor(healthFactor))
  let healthFactorColor = "text-green-500"
  if (healthFactorValue < 1.5) healthFactorColor = "text-red-500"
  else if (healthFactorValue < 2) healthFactorColor = "text-yellow-500"

  return (
    <div className="space-y-6">
      {/* Position Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className={cardStyles}>
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-200">Borrowed</CardTitle>
            <CardDescription className="text-gray-400">Your borrowed assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-200">
              {formatTokenAmount(currentLoan.toString(), market.loanTokenDecimals)} 
              <span className="text-gray-400 text-lg ml-2">{market.loanTokenSymbol}</span>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Interest: {formatTokenAmount(market.borrowAPR, 18, 2)}% APR
            </div>
          </CardContent>
        </Card>

        <Card className={cardStyles}>
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-200">Collateral</CardTitle>
            <CardDescription className="text-gray-400">Your supplied collateral</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-200 flex flex-wrap items-baseline break-all">
              <span className="break-all mr-2">
                {formatTokenAmount(currentCollateral.toString(), market.collateralTokenDecimals)}
              </span>
              <span className="text-gray-400 text-lg">{market.collateralTokenSymbol}</span>
            </div>
            <div className="text-sm text-gray-400 mt-2 break-words">
              ≈ ${formatTokenAmount((currentCollateral * parseFloat(formatTokenAmount(market.currentPrice, 18))).toString(), 0, 2)} USD
            </div>
          </CardContent>
        </Card>

        <Card className={cardStyles}>
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-200">Health</CardTitle>
            <CardDescription className="text-gray-400">Position health metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-400 mb-1">Current LTV</div>
                <div className="text-xl font-medium text-gray-200">
                  {(ltv*100).toFixed(2)}% <span className="text-gray-400 text-sm">/ {formatLTV(market.lltv, 18)}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5 mt-1">
                  <div 
                    className="bg-gradient-to-r from-green-600 via-yellow-600 to-red-600 h-2.5 rounded-full" 
                    style={{ width: `${((ltv*100) / parseFloat(formatLTV(market.lltv, 18))) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-1">Health Factor</div>
                <div className={`text-xl font-medium ${healthFactorColor}`}>
                  {healthFactorValue.toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Position History Chart with Tabs */}
      <PositionChartTabs positionHistory={positionHistory} cardStyles={cardStyles} />
    </div>
  )
} 