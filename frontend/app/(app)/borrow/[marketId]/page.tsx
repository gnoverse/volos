"use client"

import "@/app/theme.css"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InfoIcon } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { formatUnits } from "viem"
import { MarketChart } from "../components/market-chart"
import { assets } from "../mock"
import { marketHistory } from "../mock-history"

export default function MarketPage() {
  const params = useParams()
  const decodedMarketId = decodeURIComponent(params.marketId as string)
  const market = assets.find((asset) => asset.id === decodedMarketId)
  const history = marketHistory[decodedMarketId]

  // Add state for APY variations
  const [apyVariations, setApyVariations] = useState({
    sevenDay: 0,
    ninetyDay: 0
  })

  // Calculate random variations once after mount
  useEffect(() => {
    setApyVariations({
      sevenDay: 1 + Math.random() * 0.1,
      ninetyDay: 1 - Math.random() * 0.1
    })
  }, [])

  if (!market || !history) {
    return <div>Market not found</div>
  }

  return (
    <div className="container items-center justify-center space-y-6">
      <h1 className="text-[48px] font-bold mb-12 text-gray-200">
        {market.loanSymbol} / {market.collateralSymbol} Market
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
      <Card className="bg-gray-800/80 bg-gradient-to-b from-gray-800/80 to-gray-700/70 border-none">
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

        <Card className="bg-gray-800/80 bg-gradient-to-b from-gray-800/80 to-gray-700/70 border-none">
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

        <Card className="bg-gray-800/80 bg-gradient-to-b from-gray-800/80 to-gray-700/70 border-none">
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
          color="rgba(34, 197, 94, 0.95)"
        />
        <MarketChart
          data={history}
          title="Total Borrow"
          description="Total assets borrowed from the market"
          dataKey="borrow"
          color="rgba(239, 68, 68, 0.95)"
        />
        <MarketChart
          data={history}
          title="Utilization Rate"
          description="Percentage of supplied assets being borrowed"
          dataKey="utilization"
          color="rgba(99, 102, 241, 0.95)"
        />
        <MarketChart
          data={history}
          title="APY"
          description="Annual Percentage Yield"
          dataKey="apy"
          color="rgba(245, 158, 11, 0.95)"
        />
      </div>

      {/* Performance Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-gray-800/80 bg-gradient-to-b from-gray-800/80 to-gray-700/70 border-none">
      <CardHeader>
            <CardTitle className="text-gray-200">7D APY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-200">
              {(market.apy * apyVariations.sevenDay).toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 bg-gradient-to-b from-gray-800/80 to-gray-700/70 border-none">
        <CardHeader>
            <CardTitle className="text-gray-200">30D APY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-200">
              {market.apy.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 bg-gradient-to-b from-gray-800/80 to-gray-700/70 border-none">
        <CardHeader>
            <CardTitle className="text-gray-200">90D APY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-200">
              {(market.apy * apyVariations.ninetyDay).toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-200">Risk</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gray-800/80 bg-gradient-to-b from-gray-800/80 to-gray-700/70 border-none">
        <CardHeader>
              <CardTitle className="text-gray-200 flex items-center gap-2">
                Risk Rating by Credora ®
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-400">Has not been rated yet</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/80 bg-gradient-to-b from-gray-800/80 to-gray-700/70 border-none">
          <CardHeader>
              <CardTitle className="text-gray-200">Curator TVL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-200 text-2xl font-bold">$578.40M</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/80 bg-gradient-to-b from-gray-800/80 to-gray-700/70 border-none">
          <CardHeader>
              <CardTitle className="text-gray-200">Vault Deployment Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-200">15/03/2024</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/80 bg-gradient-to-b from-gray-800/80 to-gray-700/70 border-none">
          <CardHeader>
              <CardTitle className="text-gray-200">Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-200 font-mono">0x3300...f8c4</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/80 bg-gradient-to-b from-gray-800/80 to-gray-700/70 border-none">
          <CardHeader>
              <CardTitle className="text-gray-200">Curator Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-200 font-mono">0x0000...0000</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/80 bg-gradient-to-b from-gray-800/80 to-gray-700/70 border-none">
          <CardHeader>
              <CardTitle className="text-gray-200">Timelock / Guardian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-200">1D / 0x0000...0000</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Disclosures Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
          Disclosures <InfoIcon className="h-4 w-4 text-gray-400" />
        </h2>
        <Card className="bg-gray-800/80 bg-gradient-to-b from-gray-800/80 to-gray-700/70 border-none">
        <CardContent className="pt-6">
            <p className="text-gray-400">Curator has not submitted a Disclosure.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
