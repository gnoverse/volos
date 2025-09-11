"use client"

import { useMarketActivityQuery } from "@/app/(app)/borrow/queries-mutations"
import { Market } from "@/app/types"
import { MarketOverview } from "@/components/market-overview"
import { MyPosition } from "@/components/my-position"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { activityColumns } from "./activity-columns"
import { DataTable } from "./ui/data-table"

interface MarketTabsProps {
  market: Market;
  apyVariations: {
    sevenDay: number;
    ninetyDay: number;
  };
  cardStyles: string;
  caller: string;
}

export function MarketTabs({ 
  market, 
  apyVariations, 
  cardStyles,
  caller
}: MarketTabsProps) {

  const { data: marketActivityResponse } = useMarketActivityQuery(market.id);

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-6 border-b border-gray-700/50 w-full bg-transparent p-0 h-auto flex flex-row justify-start rounded-none">
        <TabsTrigger 
          value="overview" 
          className="bg-transparent px-6 py-3 text-gray-400 hover:bg-transparent data-[state=active]:text-logo-500 data-[state=active]:bg-transparent rounded-none transition-all"
        >
          Market Overview
        </TabsTrigger>
        <TabsTrigger 
          value="position" 
          className="bg-transparent px-6 py-3 text-gray-400 hover:bg-transparent data-[state=active]:text-logo-500 data-[state=active]:bg-transparent rounded-none transition-all"
        >
          My Position
        </TabsTrigger>
        <TabsTrigger 
          value="activity" 
          className="bg-transparent px-6 py-3 text-gray-400 hover:bg-transparent data-[state=active]:text-logo-500 data-[state=active]:bg-transparent rounded-none transition-all"
        >
          Activity
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="mt-0">
        <MarketOverview 
          market={market} 
          apyVariations={apyVariations} 
          cardStyles={cardStyles}
        />
      </TabsContent>
      
      <TabsContent value="position" className="mt-0">
        <MyPosition
          marketId={market.id}
          cardStyles={cardStyles}
          caller={caller}
        />
      </TabsContent>

      <TabsContent value="activity" className="mt-0">
        <DataTable 
          columns={activityColumns} 
          data={marketActivityResponse?.activities || []} 
          className="w-full h-full mt-0" 
        />
      </TabsContent>
    </Tabs>
  )
} 
