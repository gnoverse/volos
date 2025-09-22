"use client"

import { Market } from "@/app/types"
import { formatPercentage, parseTokenAmount, wadToPercentage } from "@/app/utils/format.utils"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { formatUnits } from "viem"

export type MarketSortField = 'created_at' | 'total_supply' | 'supply_apr' | 'borrow_apr'
export type MarketSortDir = 'asc' | 'desc'

export function getMarketColumns(currentField: MarketSortField, currentDir: MarketSortDir, onSortChange: (field: MarketSortField, dir: MarketSortDir) => void): ColumnDef<Market>[] {
  const nextDir = (field: MarketSortField): MarketSortDir => (currentField === field && currentDir === 'asc' ? 'desc' : 'asc')

  return [
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
          <span className="font-medium">{collateralSymbol.toUpperCase()}</span>
        </div>
      )
    },
  },
  {
    id: "total_supply_value",
    accessorFn: (row) => Number(row.total_supply ?? 0),
    header: () => {
      return (
        <div className="flex justify-start">
          <Button
            variant="ghost"
            onClick={() => onSortChange('total_supply', nextDir('total_supply'))}
            className="hover:text-logo-400"
          >
            Total Market Size
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      return <div className="text-left font-medium px-3">{parseTokenAmount(row.original.total_supply, row.original.loan_token_decimals)} {row.original.loan_token_symbol}</div>
    },
    enableSorting: false,
  },
  {
    id: "supply_apr_value",
    accessorFn: (row) => Number(row.supply_apr ?? 0),
    header: () => {
      return (
        <div className="flex justify-start">
          <Button
            variant="ghost"
            onClick={() => onSortChange('supply_apr', nextDir('supply_apr'))}
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
    enableSorting: false,
  },
  {
    id: "available_liquidity_display",
    header: () => {
      return (
        <div className="text-left px-3">Total Liquidity</div>
      )
    },
    cell: ({ row }) => {
      const totalSupplyBigInt = BigInt(row.original.total_supply);
      const totalBorrowBigInt = BigInt(row.original.total_borrow);
      const availableLiquidity = totalSupplyBigInt - totalBorrowBigInt;
      return (
        <div className="text-left font-medium px-3">
          {formatUnits(availableLiquidity, row.original.loan_token_decimals)} {row.original.loan_token_symbol}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    id: "borrow_apr_value",
    accessorFn: (row) => Number(row.borrow_apr ?? 0),
    header: () => {
      return (
        <div className="flex justify-start">
          <Button
            variant="ghost"
            onClick={() => onSortChange('borrow_apr', nextDir('borrow_apr'))}
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
    enableSorting: false,
  },
  {
    accessorKey: "lltv",
    header: () => {
      return <div className="text-left">Liq. LTV</div>
    },
    cell: ({ row }) => {
      return <div className="text-left font-medium">{formatPercentage(wadToPercentage(row.original.lltv))}</div>
    },
  },
 ]
}
