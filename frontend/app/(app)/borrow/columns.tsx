"use client"

import { Market } from "@/app/types"
import { formatPercentage, parseTokenAmount, wadToPercentage } from "@/app/utils/format.utils"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

export const columns: ColumnDef<Market>[] = [
  {
    accessorKey: "loan_token_symbol",
    header: () => {
      return (
        <div className="text-left px-3">Loan Asset</div>
      )
    },
    cell: ({ row }) => {
      const loanSymbol = row.original.loan_token_symbol
      
      return (
        <div className="flex items-center text-left px-3">
          <span className="font-medium">{loanSymbol}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "collateral_token_symbol",
    header: () => {
      return (
        <div className="text-left px-3">Collateral Asset</div>
      )
    },
    cell: ({ row }) => {
      const collateralSymbol = row.original.collateral_token_symbol
      
      return (
        <div className="flex items-center text-left px-3">
          <span className="font-medium">{collateralSymbol}</span>
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
            className="hover:text-logo-400"
          >
            Total Supply
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      return <div className="text-left font-medium px-3">{parseTokenAmount(row.original.total_supply, row.original.loan_token_decimals)} {row.original.loan_token_symbol}</div>
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
            className="hover:text-logo-400"
          >
            Total Borrow
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      return <div className="text-left font-medium px-3">{parseTokenAmount(row.original.total_borrow, row.original.loan_token_decimals)} {row.original.loan_token_symbol}</div>
    },
  },
  {
    accessorKey: "supplyAPR",
    header: ({ column }) => {
      return (
        <div className="flex justify-start">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:text-logo-400"
          >
            Supply APR
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      return <div className="text-left font-medium px-3">{formatPercentage(wadToPercentage(row.original.supply_apr))}</div>
    },
  },
  {
    accessorKey: "borrowAPR",
    header: ({ column }) => {
      return (
        <div className="flex justify-start">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:text-logo-400"
          >
            Borrow APR
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      return <div className="text-left font-medium px-3">{formatPercentage(wadToPercentage(row.original.borrow_apr))}</div>
    },
  },
  {
    accessorKey: "lltv",
    header: () => {
      return <div className="text-left">Max LTV</div>
    },
    cell: ({ row }) => {
      return <div className="text-left font-medium">{formatPercentage(wadToPercentage(row.original.lltv))}</div>
    },
  },
] 
