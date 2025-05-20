"use client"

import { MarketHistory } from "@/app/(app)/borrow/mock-history"
import { formatApyVariation } from "@/app/utils/format.utils"
import { InfoCard } from "@/components/InfoCard"
import { MarketChart } from "@/components/market-chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Market {
  borrowAPR: string;
  loanTokenSymbol: string;
  collateralTokenSymbol: string;
  collateralTokenDecimals: number;
  loanTokenDecimals: number;
  lltv: string;
}

interface MarketTabsProps {
  history: MarketHistory[];
  market: Market;
  apyVariations: {
    sevenDay: number;
    ninetyDay: number;
  };
  cardStyles: string;
}

export function MarketTabs({ history, market, apyVariations, cardStyles }: MarketTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-6 border-b border-gray-700/50 w-full bg-transparent p-0 h-auto flex flex-row justify-start">
        <TabsTrigger 
          value="overview" 
          className="bg-transparent px-6 py-3 text-gray-400 hover:bg-transparent data-[state=active]:text-midnightPurple-500 data-[state=active]:bg-transparent data-[state=active]:border-b-1 data-[state=active]:border-midnightPurple-500 rounded-none transition-all"
        >
          Market Overview
        </TabsTrigger>
        <TabsTrigger 
          value="position" 
          className="bg-transparent px-6 py-3 text-gray-400 hover:bg-transparent data-[state=active]:text-midnightPurple-500 data-[state=active]:bg-transparent data-[state=active]:border-b-1 data-[state=active]:border-midnightPurple-500 rounded-none transition-all"
        >
          My Position
        </TabsTrigger>
        <TabsTrigger 
          value="activity" 
          className="bg-transparent px-6 py-3 text-gray-400 hover:bg-transparent data-[state=active]:text-midnightPurple-500 data-[state=active]:bg-transparent data-[state=active]:border-b-1 data-[state=active]:border-midnightPurple-500 rounded-none transition-all"
        >
          Activity
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="mt-0">
        {/* Charts */}
        <div className="grid grid-cols-1 gap-6">
          <MarketChart
            data={history}
            title="Total Supply"
            description="Total assets supplied to the market"
            dataKey="supply"
            color="rgba(34, 197, 94, 0.95)"
            className={cardStyles}
          />
          <MarketChart
            data={history}
            title="Total Borrow"
            description="Total assets borrowed from the market"
            dataKey="borrow"
            color="rgba(239, 68, 68, 0.95)"
            className={cardStyles}
          />
          <MarketChart
            data={history}
            title="Utilization Rate"
            description="Percentage of supplied assets being borrowed"
            dataKey="utilization"
            color="rgba(99, 102, 241, 0.95)"
            className={cardStyles}
          />
          <MarketChart
            data={history}
            title="APY"
            description="Annual Percentage Yield"
            dataKey="apy"
            color="rgba(245, 158, 11, 0.95)"
            className={cardStyles}
          />
        </div>

        {/* Performance Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <InfoCard
            title="7D APY"
            value={formatApyVariation(market.borrowAPR, apyVariations.sevenDay, 18, 2)}
          />
          <InfoCard
            title="30D APY"
            value={formatApyVariation(market.borrowAPR, 1, 18, 2)}
          />
          <InfoCard
            title="90D APY"
            value={formatApyVariation(market.borrowAPR, apyVariations.ninetyDay, 18, 2)}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="position" className="mt-0">
        <div className="min-h-[200px] flex items-center justify-center text-gray-400">
          My Position content will be added here
        </div>
      </TabsContent>

      <TabsContent value="activity" className="mt-0">
        <div className="min-h-[200px] flex items-center justify-center text-gray-400">
          Activity content will be added here - display tx history
        </div>
      </TabsContent>
    </Tabs>
  )
} 