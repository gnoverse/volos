"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { columns } from "./columns"
import { useMarketsQuery } from "./queries"

// Create a client
const queryClient = new QueryClient()

function BorrowPageContent() {
  const router = useRouter()
  const { data: markets, isLoading, error } = useMarketsQuery()

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
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">My Loan</CardTitle>
          <div className="text-4xl font-bold text-gray-200">$0.00</div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="min-h-[100px] rounded-md bg-muted/20">
            {/* Placeholder for chart/graph */}
          </div>
          <div className="flex items-center justify-end">
            <div className="text-right">
              <div className="text-sm font-medium text-muted-foreground">Net Rate</div>
              <div className="text-2xl font-bold text-gray-200">0%</div>
            </div>
          </div>
        </CardContent>
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
