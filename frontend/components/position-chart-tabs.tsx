"use client"

import { getUserBorrowHistory, getUserCollateralHistory } from '@/app/services/api.service'
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
  const { data: collateralHistory = [], isLoading: isCollateralLoading } = useQuery({
    queryKey: ['userCollateralHistory', caller, marketId],
    queryFn: () => getUserCollateralHistory(caller, marketId),
    enabled: !!caller && !!marketId
  });

  const { data: borrowHistory = [], isLoading: isBorrowLoading } = useQuery({
    queryKey: ['userBorrowHistory', caller, marketId],
    queryFn: () => getUserBorrowHistory(caller, marketId),
    enabled: !!caller && !!marketId
  });

  // todo: fix collateral token decimals in the contract (it is 0)
  const mappedCollateral = collateralHistory.map(d => ({
    value: d.value / Math.pow(10, market.loanTokenDecimals), //this should be collateralTokenDecimals but since it doesn't work we use this
    timestamp: d.timestamp
  }));

  const mappedBorrow = borrowHistory.map(d => ({
    value: d.value / Math.pow(10, market.loanTokenDecimals),
    timestamp: d.timestamp
  }));

  const noPositionHistory = (!mappedCollateral || mappedCollateral.length === 0) && (!mappedBorrow || mappedBorrow.length === 0);
  const isLoading = isCollateralLoading || isBorrowLoading;

  if (isLoading) {
    return (
      <div className="min-h-[200px] flex flex-col items-center justify-center text-gray-400 p-8">
        <div className="text-2xl mb-4">Loading Position History...</div>
        <p className="text-center max-w-md">
          Fetching your position data from the blockchain.
        </p>
      </div>
    );
  }

  if (noPositionHistory) {
    return (
      <div className="min-h-[200px] flex flex-col items-center justify-center text-gray-400 p-8">
        <div className="text-2xl mb-4">No Position History Available</div>
        <p className="text-center max-w-md">
          There is no position history data available for this market at the moment.
        </p>
      </div>
    );
  }

  return (
    <Card className={cn("bg-gray-700/60 border-none rounded-3xl", cardStyles)}>
      <Tabs defaultValue={mappedCollateral.length > 0 ? "collateral" : "borrowed"} className="w-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-gray-200">Position History</CardTitle>
          <CardDescription className="text-gray-400">Track your position metrics over time</CardDescription>
        </div>
        <TabsList className="bg-customGray-800/70 rounded-md h-7 w-auto px-0.5">
          {mappedCollateral.length > 0 && (
            <TabsTrigger 
              value="collateral" 
              className="rounded-md text-gray-400 text-xs data-[state=active]:text-gray-200 px-3 py-1"
            >
              Collateral
            </TabsTrigger>
          )}
          {mappedBorrow.length > 0 && (
            <TabsTrigger 
              value="borrowed" 
              className="rounded-md text-gray-400 text-xs data-[state=active]:text-gray-200 px-3 py-1"
            >
              Borrowed
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="health" 
            className="rounded-md text-gray-400 text-xs data-[state=active]:text-gray-200 px-3 py-1"
          >
            Health
          </TabsTrigger>
        </TabsList>
      </CardHeader>
      <CardContent className="items-center">
        {mappedCollateral.length > 0 && (
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
        )}
        {mappedBorrow.length > 0 && (
          <TabsContent value="borrowed" className="mt-0">
            <Chart
              title=""
              description=""
              data={mappedBorrow}
              dataKey="value"
              color="rgba(239, 68, 68, 0.95)"
              className="pt-6"
            />
          </TabsContent>
        )}
        <TabsContent value="health" className="mt-0">
          <Chart
            title=""
            description=""
            data={mappedCollateral}
            dataKey="value"
            color="rgba(99, 102, 241, 0.95)"
            className="pt-6"
          />
        </TabsContent>
      </CardContent>
      </Tabs>
    </Card>
  )
}
