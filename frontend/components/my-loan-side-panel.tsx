"use client"

import { UserLoan } from "@/app/types"
import { parseTokenAmount } from "@/app/utils/format.utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"


interface MyLoanSidePanelProps {
  netRate: string
  apy: string
  rewards: string
  className?: string
  userLoans?: UserLoan[]
}

export function MyLoanSidePanel({ netRate, className, userLoans }: MyLoanSidePanelProps) {
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
                APR
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
                {userLoans && userLoans.length > 0 ? (
                    <div className="space-y-2">
                        {userLoans.map((loan, index) => (
                            <div key={index} className="flex justify-between items-center">
                                <div className="text-sm text-gray-300">{loan.token}</div>
                                <div className="text-sm font-medium text-gray-200">{parseTokenAmount(loan.amount, 6)}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-gray-400 mb-1">No active loans</div>
                )}
            </TabsContent>
            <TabsContent value="rewards" className="mt-0">
                <div className="text-sm text-gray-400 mb-1">TODO: display data</div>
            </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
} 
