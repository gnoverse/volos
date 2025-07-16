"use client"

import { AdenaService } from "@/app/services/adena.service"
import { getUserLoanHistory } from "@/app/services/api.service"
import { formatCurrency } from "@/app/utils/format.utils"
import { Chart } from "@/components/chart"
import { MyLoanSidePanel } from "@/components/my-loan-side-panel"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { columns } from "./columns"
import { useMarketsQuery } from "./queries-mutations"

export default function BorrowPage() {
  const router = useRouter()
  const [userAddress, setUserAddress] = useState<string>("")
  const [totalLoanAmount, setTotalLoanAmount] = useState("0.00")
  const { data: markets, isLoading, error } = useMarketsQuery()

  const { data: userLoanHistory = [], isLoading: isUserLoanLoading } = useQuery({
    queryKey: ['userLoanHistory', userAddress],
    queryFn: () => getUserLoanHistory(userAddress!),
    enabled: !!userAddress
  });

  // track user address
  useEffect(() => {
    const adena = AdenaService.getInstance()
    setUserAddress(adena.getAddress())

    const handleAddressChange = (event: CustomEvent) => {
      setUserAddress(event.detail?.newAddress || "")
    }
    window.addEventListener("adenaAddressChanged", handleAddressChange as EventListener)

    return () => {
      window.removeEventListener("adenaAddressChanged", handleAddressChange as EventListener)
    }
  }, [])
  
  useEffect(() => {
    if (userLoanHistory && userLoanHistory.length > 0) {
      // Get the last (most recent) value from the history
      const lastEntry = userLoanHistory[userLoanHistory.length - 1]
      setTotalLoanAmount(lastEntry.value.toFixed(2))
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
      <Card className="mb-6 bg-customGray-800/60 backdrop-blur-sm rounded-3xl">
        <div className="flex flex-col md:flex-row">
          <div className="flex-grow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">My Loan</CardTitle>
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
                  userLoanHistory.length > 0 && (
                    <Chart
                      data={userLoanHistory}
                      title="My Loan History"
                      description="Your total borrowed amount over time"
                      dataKey="value"
                      color="#5B21B6"
                      className="bg-transparent border-none p-0 shadow-none"
                    />
                  )
                )}
              </div>
            </CardContent>
          </div>
          <div className="w-full md:w-1/3 md:border-l md:border-gray-700/50">
            <MyLoanSidePanel 
              netRate={userLoanHistory.length > 0 ? "4.8%" : "0%"}
              apy="5.2%"
              rewards="$12.45"
              className="h-full bg-transparent border-none shadow-none rounded-none md:rounded-r-3xl md:rounded-l-none"
              userLoans={[]}
            />
          </div>
        </div>
      </Card>
      
      <h1 className="text-2xl font-bold mb-6 text-gray-200">Borrow Assets</h1>
      {isLoading ? (
        <div className="flex justify-center items-center h-32 text-muted-foreground">Loading markets data...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={markets || []} 
          getRowId={(row) => row.poolPath}
          onRowClick={handleRowClick}
        />
      )}
    </div>
  )
}
