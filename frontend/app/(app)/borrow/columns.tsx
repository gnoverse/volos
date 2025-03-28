"use client"

import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

// Define the data type for our table
export type Asset = {
  id: string
  token: string
  symbol: string
  available: number
  apy: number
  collateralFactor: number
}

export const columns: ColumnDef<Asset>[] = [
  {
    accessorKey: "token",
    header: "Asset",
    cell: ({ row }) => <div className="font-medium">{row.getValue("token")}</div>,
  },
  {
    accessorKey: "symbol",
    header: "Symbol",
  },
  {
    accessorKey: "available",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Available
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("available"))
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "apy",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          APY
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="text-right">{row.getValue("apy")}%</div>
    },
  },
  {
    accessorKey: "collateralFactor",
    header: "Collateral Factor",
    cell: ({ row }) => {
      const factor = parseFloat(row.getValue("collateralFactor"))
      const formatted = `${(factor * 100).toFixed(0)}%`
      return <div className="text-right">{formatted}</div>
    },
  },
  {
    id: "actions",
    cell: () => {
      return (
        <Button className="w-full" variant="outline">
          Borrow
        </Button>
      )
    },
  },
] 
