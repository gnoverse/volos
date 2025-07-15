"use client"

import { getUserCollateralHistory } from '@/app/services/api.service'
import { MarketInfo } from '@/app/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useQuery } from '@tanstack/react-query'
import { Chart } from './chart'

interface PositionChartTabsProps {
  caller: string
  marketId: string
  market: MarketInfo
  cardStyles: string
}

export function PositionChartTabs({ caller, marketId, market, cardStyles }: PositionChartTabsProps) {
  const { data: collateralHistory = [] } = useQuery({
    queryKey: ['userCollateralHistory', caller, marketId],
    queryFn: () => getUserCollateralHistory(caller, marketId),
    enabled: !!caller && !!marketId
  });

  // todo: fix collateral token decimals in the contract (it is 0)
  const mappedCollateral = collateralHistory.map(d => ({
    value: d.value / Math.pow(10, market.collateralTokenDecimals),
    timestamp: d.timestamp
  }));


  // Health factor logic can be added here if needed

  return (
    <Card className={cn("bg-gray-700/60 border-none rounded-3xl", cardStyles)}>
      <Tabs defaultValue="collateral" className="w-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-gray-200">Position History</CardTitle>
          <CardDescription className="text-gray-400">Track your position metrics over time</CardDescription>
        </div>
          <TabsList className="bg-customGray-800/70 rounded-md h-7 w-auto px-0.5">
            <TabsTrigger 
              value="collateral" 
              className="rounded-md text-gray-400 text-xs data-[state=active]:text-gray-200 px-3 py-1"
            >
              Collateral
            </TabsTrigger>
            <TabsTrigger 
              value="borrowed" 
              className="rounded-md text-gray-400 text-xs data-[state=active]:text-gray-200 px-3 py-1"
            >
              Borrowed
            </TabsTrigger>
            <TabsTrigger 
              value="health" 
              className="rounded-md text-gray-400 text-xs data-[state=active]:text-gray-200 px-3 py-1"
            >
              Health
            </TabsTrigger>
          </TabsList>
      </CardHeader>
      <CardContent className="items-center">
          <TabsContent value="collateral" className="mt-0">
            <Chart
              title=""
              description=""
              data={mappedCollateral}
              dataKey="value"
              color="rgba(34, 197, 94, 0.95)"
              className="pt-6"
            />
          </TabsContent>
          <TabsContent value="borrowed" className="mt-0">
            <Chart
              title=""
              description=""
              data={mappedCollateral}
              dataKey="value"
              color="rgba(239, 68, 68, 0.95)"
              className="pt-6"
            />
          </TabsContent>
          <TabsContent value="health" className="mt-0">
            <Chart
              title=""
              description=""
              data={[]}
              dataKey="healthFactor"
              color="rgba(99, 102, 241, 0.95)"
              className="pt-6"
            />
          </TabsContent>
      </CardContent>
      </Tabs>
    </Card>
  )
}
