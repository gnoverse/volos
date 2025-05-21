"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface MyLoanSidePanelProps {
  netRate: string
  apy: string
  rewards: string
  className?: string
}

export function MyLoanSidePanel({ netRate, className }: MyLoanSidePanelProps) {
  return (
    <Card className={cn("bg-gray-700/60 border-none rounded-3xl", className)}>
        <Tabs defaultValue="apy" className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
            <div className="text-sm font-medium text-muted-foreground">Net Rate</div>
            <div className="text-2xl font-bold text-gray-200">{netRate}</div>
            </div>
            <TabsList className="bg-customGray-800 rounded-md h-7 w-auto px-0.5">
            <TabsTrigger 
                value="apy" 
                className="rounded-md text-gray-400 text-xs data-[state=active]:text-gray-200 px-3 py-1"
            >
                APY
            </TabsTrigger>
            <TabsTrigger 
                value="rewards" 
                className="rounded-md text-gray-400 text-xs data-[state=active]:text-gray-200 px-3 py-1"
            >
                Rewards
            </TabsTrigger>
            </TabsList>
        </CardHeader>
        <CardContent>
            <TabsContent value="apy" className="mt-0">
                <div className="text-sm text-gray-400 mb-1">TODO: display data</div>
            </TabsContent>
            <TabsContent value="rewards" className="mt-0">
                <div className="text-sm text-gray-400 mb-1">TODO: display data</div>
            </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
} 