"use client"

import { AdenaService } from "@/app/services/adena.service"
import { formatCurrency } from "@/app/utils/format.utils"
import { MyLoanSidePanel } from "@/components/my-loan-side-panel"
import { PositionChart } from "@/components/position-chart"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { columns } from "./columns"
import { getUserLoanHistory, PositionHistory } from "./mock-history"
import { useMarketsQuery, useUserLoansQuery } from "./queries-mutations"

// Create a client
const queryClient = new QueryClient()

function BorrowPageContent() {
  const router = useRouter()
  const { data: markets, isLoading, error } = useMarketsQuery()
  const [userAddress, setUserAddress] = useState<string>("")
  const { data: userLoans } = useUserLoansQuery(userAddress || "")
  const [totalLoanAmount, setTotalLoanAmount] = useState("0.00")
  const [loanHistory, setLoanHistory] = useState<PositionHistory[]>([])

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
    if (userLoans && userLoans.length > 0) {
      const total = userLoans.reduce((sum, loan) => { //data represented is as if all tokens were worth $1
        return sum + parseFloat(loan.amount)
      }, 0)
      setTotalLoanAmount(total.toFixed(2))
      
      setLoanHistory(getUserLoanHistory())
    }
  }, [userLoans])

  const handleRowClick = (id: string) => {
    router.push(`/borrow/${encodeURIComponent(id)}`)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading markets data...</div>
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
              <div className="text-4xl font-bold text-gray-200">{formatCurrency(totalLoanAmount)}</div>
            </CardHeader>
            <CardContent>
              <div className="min-h-[100px] rounded-md mt-6">
                {loanHistory.length > 0 && (
                  <PositionChart
                    data={loanHistory}
                    dataKey="borrowed"
                    color="rgb(239, 68, 68)"
                    className="bg-transparent border-none p-0 shadow-none"
                  />
                )}
              </div>
            </CardContent>
          </div>
          <div className="w-full md:w-1/3 md:border-l md:border-gray-700/50">
            <MyLoanSidePanel 
              netRate={userLoans && userLoans.length > 0 ? "4.8%" : "0%"}
              apy="5.2%"
              rewards="$12.45"
              className="h-full bg-transparent border-none shadow-none rounded-none md:rounded-r-3xl md:rounded-l-none"
            />
          </div>
        </div>
      </Card>
      
      <h1 className="text-2xl font-bold mb-6 text-gray-200">Borrow Assets</h1>
      <DataTable 
        columns={columns} 
        data={markets || []} 
        getRowId={(row) => row.poolPath} //todo change to marketId
        onRowClick={handleRowClick}
      />
    </div>
  )
}

export default function BorrowPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <BorrowPageContent />
    </QueryClientProvider>
  )
}
