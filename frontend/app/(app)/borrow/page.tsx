"use client"

import { DataTable } from "@/components/ui/data-table"
import { useRouter } from "next/navigation"
import { columns } from "./columns"
import { Asset, assets } from "./mock"

export default function BorrowPage() {
  const router = useRouter()

  const handleRowClick = (id: string) => {
    router.push(`/borrow/${id}`)
  }

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-200">Borrow Assets</h1>
      <DataTable 
        columns={columns} 
        data={assets} 
        getRowId={(row: Asset) => row.id}
        onRowClick={handleRowClick}
      />
    </div>
  )
}
