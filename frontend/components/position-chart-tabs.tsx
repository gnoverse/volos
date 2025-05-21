"use client"

import { PositionHistory } from "@/app/(app)/borrow/mock-history"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { PositionChart } from "./position-chart"

interface PositionChartTabsProps {
  positionHistory: PositionHistory[]
  cardStyles: string
}

export function PositionChartTabs({ positionHistory, cardStyles }: PositionChartTabsProps) {
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
      <CardContent>
          <TabsContent value="collateral" className="mt-0 -ml-6">
            <PositionChart
              data={positionHistory}
              dataKey="collateral"
              color="rgba(34, 197, 94, 0.95)"
              className="pt-6"
            />
          </TabsContent>
          <TabsContent value="borrowed" className="mt-0 -ml-6">
            <PositionChart
              data={positionHistory}
              dataKey="borrowed"
              color="rgba(239, 68, 68, 0.95)"
              className="pt-6"
            />
          </TabsContent>
          <TabsContent value="health" className="mt-0 -ml-6">
            <PositionChart
              data={positionHistory}
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