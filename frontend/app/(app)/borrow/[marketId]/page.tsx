"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useParams } from "next/navigation"
import { formatUnits } from "viem"
import { MarketChart } from "../components/market-chart"
import { assets } from "../mock"
import { marketHistory } from "../mock-history"

export default function MarketPage() {
  const params = useParams()
  const decodedMarketId = decodeURIComponent(params.marketId as string)
  const market = assets.find((asset) => asset.id === decodedMarketId)
  const history = marketHistory[decodedMarketId]

  if (!market || !history) {
    return <div>Market not found</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-200">
        {market.loanSymbol} / {market.collateralSymbol} Market
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gray-800/60 border-none shadow-lg backdrop-blur-sm bg-gradient-to-b from-gray-800/60 to-gray-900/60">
          <CardHeader>
            <CardTitle className="text-gray-200">Market Overview</CardTitle>
            <CardDescription className="text-gray-400">Basic information about the market</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Loan Token</span>
              <span className="font-medium text-gray-200">{market.loanSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Collateral Token</span>
              <span className="font-medium text-gray-200">{market.collateralSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Price</span>
              <span className="font-medium text-gray-200">
                {Number(formatUnits(BigInt(market.price), 18)).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 border-none shadow-lg backdrop-blur-sm bg-gradient-to-b from-gray-800/60 to-gray-900/60">
          <CardHeader>
            <CardTitle className="text-gray-200">Market Size</CardTitle>
            <CardDescription className="text-gray-400">Supply and borrow information</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Supply</span>
              <span className="font-medium text-gray-200">
                {Number(formatUnits(BigInt(market.totalSupplyAssets), 18)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Borrow</span>
              <span className="font-medium text-gray-200">
                {Number(formatUnits(BigInt(market.totalBorrowAssets), 18)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Utilization</span>
              <span className="font-medium text-gray-200">
                {(Number(formatUnits(BigInt(market.totalBorrowAssets), 18)) / 
                  Number(formatUnits(BigInt(market.totalSupplyAssets), 18)) * 100).toFixed(2)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 border-none shadow-lg backdrop-blur-sm bg-gradient-to-b from-gray-800/60 to-gray-900/60">
          <CardHeader>
            <CardTitle className="text-gray-200">Parameters</CardTitle>
            <CardDescription className="text-gray-400">Market parameters and rates</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex justify-between">
              <span className="text-gray-400">APY</span>
              <span className="font-medium text-gray-200">{market.apy}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max LTV</span>
              <span className="font-medium text-gray-200">
                {(Number(formatUnits(BigInt(market.lltv), 18)) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fee</span>
              <span className="font-medium text-gray-200">
                {(Number(formatUnits(BigInt(market.fee), 18))).toFixed(2)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <MarketChart
          data={history}
          title="Total Supply"
          description="Total assets supplied to the market"
          dataKey="supply"
          color="rgba(34, 197, 94, 0.8)"
        />
        <MarketChart
          data={history}
          title="Total Borrow"
          description="Total assets borrowed from the market"
          dataKey="borrow"
          color="rgba(239, 68, 68, 0.8)"
        />
        <MarketChart
          data={history}
          title="Utilization Rate"
          description="Percentage of supplied assets being borrowed"
          dataKey="utilization"
          color="rgba(99, 102, 241, 0.8)"
        />
        <MarketChart
          data={history}
          title="APY"
          description="Annual Percentage Yield"
          dataKey="apy"
          color="rgba(245, 158, 11, 0.8)"
        />
      </div>
    </div>
  )
}
