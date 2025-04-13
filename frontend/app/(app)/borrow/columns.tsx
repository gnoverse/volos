"use client"

import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { formatUnits } from "viem"
import { Asset } from "./mock"

export const columns: ColumnDef<Asset>[] = [
  {
    accessorKey: "loanSymbol",
    header: () => {
      return (
        <div className="text-left px-3">Asset</div>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2 text-left px-3">
          <span className="font-medium ">{row.getValue("loanSymbol")}</span>
          <span className="text-gray-500">/ {row.original.collateralSymbol}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "totalSupplyAssets",
    header: ({ column }) => {
      return (
        <div className="flex justify-start">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Supply
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const amount = formatUnits(BigInt(row.getValue("totalSupplyAssets")), 18)
      return <div className="text-left font-medium px-3">{Number(amount).toFixed(2)}</div>
    },
  },
  {
    accessorKey: "totalBorrowAssets",
    header: ({ column }) => {
      return (
        <div className="flex justify-start">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Borrow
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const amount = formatUnits(BigInt(row.getValue("totalBorrowAssets")), 18)
      return <div className="text-left font-medium px-3">{Number(amount).toFixed(2)}</div>
    },
  },
  {
    accessorKey: "apy",
    header: ({ column }) => {
      return (
        <div className="flex justify-start">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            APY
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      return <div className="text-left font-medium px-3">{row.getValue("apy")}%</div>
    },
  },
  {
    accessorKey: "lltv",
    header: () => {
      return <div className="text-left">Max LTV</div>
    },
    cell: ({ row }) => {
      const lltv = formatUnits(BigInt(row.getValue("lltv")), 18)
      return <div className="text-left font-medium">{(Number(lltv) * 100).toFixed(0)}%</div>
    },
  },
] 
