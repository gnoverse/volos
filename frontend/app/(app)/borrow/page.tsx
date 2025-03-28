"use client"

import { DataTable } from "@/components/ui/data-table"
import { Asset, columns } from "./columns"

// Sample data for the table
const data: Asset[] = [
  {
    id: "1",
    token: "Ethereum",
    symbol: "ETH",
    available: 245.35,
    apy: 3.21,
    collateralFactor: 0.85,
  },
  {
    id: "2",
    token: "Bitcoin",
    symbol: "BTC",
    available: 12.43,
    apy: 2.54,
    collateralFactor: 0.80,
  },
  {
    id: "3",
    token: "Solana",
    symbol: "SOL",
    available: 1254.67,
    apy: 5.32,
    collateralFactor: 0.70,
  },
  {
    id: "4",
    token: "USD Coin",
    symbol: "USDC",
    available: 5000.00,
    apy: 4.78,
    collateralFactor: 0.90,
  },
  {
    id: "5",
    token: "Cardano",
    symbol: "ADA",
    available: 3245.87,
    apy: 4.12,
    collateralFactor: 0.65,
  },
]

export default function BorrowPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Borrow Assets</h1>
      <DataTable columns={columns} data={data} />

    </div>
  )
}
