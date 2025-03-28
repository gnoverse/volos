"use client"

import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { assets } from "./mock"

export default function BorrowPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Borrow Assets</h1>
      <DataTable columns={columns} data={assets} />
    </div>
  )
}
