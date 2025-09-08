"use client"

import { formatCurrency } from "@/app/utils/format.utils"
import { TimePeriod } from "@/components/chart-dropdown"
import { LoansChart } from "@/components/loans-chart"
import { MyLoanSidePanel } from "@/components/my-loan-side-panel"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { useUserAddress } from "@/hooks/use-user-address"
import { WalletIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { columns } from "./columns"
import { useMarketsQuery, useUserLoanHistoryQuery } from "./queries-mutations"

export default function BorrowPage() {
  const router = useRouter()
  const { userAddress, isConnected, handleWalletConnection } = useUserAddress()
  const [totalLoanAmount, setTotalLoanAmount] = useState("0.00")
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>("1 week")
  const { data: markets, isLoading, error } = useMarketsQuery()

  const { data: userLoanHistory = [], isLoading: isUserLoanLoading } = useUserLoanHistoryQuery(userAddress!);
  
  useEffect(() => {
    if (userLoanHistory && userLoanHistory.length > 0) {
      // Get the last (most recent) value from the history
      const lastEntry = userLoanHistory[userLoanHistory.length - 1]
      setTotalLoanAmount(parseFloat(lastEntry.value).toFixed(2))
    } else {
      setTotalLoanAmount("0.00")
    }
  }, [userLoanHistory])

  const handleRowClick = (id: string) => {
    router.push(`/borrow/${encodeURIComponent(id)}`)
  }

  if (error) {
    return <div className="text-red-500">Error loading markets: {error.message}</div>
  }

  return (
    <div className="">
      <Card className="mb-6 bg-customGray-800/60 backdrop-blur-lg rounded-3xl border-logo-700">
        <div className="flex flex-col md:flex-row">
          <div className="flex-grow">
            {(!userAddress || !isConnected) ? (
              <div className="py-10 px-6">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-semibold text-logo-500">Connect Wallet</h3>
                  <p className="text-gray-400 text-sm max-w-md mx-auto">
                    Connect your wallet to view your loan history and personalized stats. Once connected, you’ll
                    see your total borrowed amount and a chart of how it changed over time.
                  </p>
                  <div>
                    <Button 
                      variant="ghost" 
                      className="bg-gray-700/20 text-gray-400 rounded-full text-lg hover:bg-gray-700/40 hover:text-logo-500 hover:border border-logo-500"
                      onClick={handleWalletConnection}
                    >
                      <WalletIcon className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-logo-600">My Loan</CardTitle>
                  <div className="text-4xl font-bold text-gray-200">
                    {isUserLoanLoading
                      ? <span className="animate-pulse bg-gray-700 rounded w-24 h-10 inline-block" />
                      : formatCurrency(totalLoanAmount)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="min-h-[100px] rounded-md mt-6">
                    {isUserLoanLoading ? (
                      <div className="h-32 flex items-center justify-center">
                        <span className="animate-pulse text-muted-foreground">Loading loan history...</span>
                      </div>
                    ) : (
                      userLoanHistory && userLoanHistory.length > 0 && (
                        <LoansChart
                          data={userLoanHistory}
                          title="My Loan History"
                          description="Your total borrowed amount over time"
                          color="#D95C12"
                          className="bg-transparent border-none p-0 shadow-none"
                          selectedTimePeriod={selectedTimePeriod}
                          onTimePeriodChangeAction={setSelectedTimePeriod}
                        />
                      )
                    )}
                  </div>
                </CardContent>
              </>
            )}
          </div>
          {(userAddress && isConnected) && (
            <div className="w-full md:w-1/3 md:border-l md:border-gray-700/50">
              <MyLoanSidePanel 
                netRate={userLoanHistory && userLoanHistory.length > 0 ? "4.8%" : "0%"}
                apy="5.2%"
                rewards="$12.45"
                className="h-full bg-transparent border-none shadow-none rounded-none md:rounded-r-3xl md:rounded-l-none"
                userLoans={[]}
              />
            </div>
          )}
        </div>
      </Card>
      
      <h1 className="text-2xl font-bold mb-6 text-logo-600">Borrow Assets</h1>
      {isLoading ? (
        <div className="flex justify-center items-center h-32 text-muted-foreground">Loading markets data...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={markets || []} 
          getRowId={(row) => row.poolPath}
          onRowClick={handleRowClick}
          clickable={true}
        />
      )}
    </div>
  )
}
