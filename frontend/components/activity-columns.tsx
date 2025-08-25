import { MarketHistory } from "@/app/services/api.service";
import { formatTimestamp } from "@/app/utils/format.utils";
import { CopiableAddress } from "@/components/copiable-addess";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

export const activityColumns: ColumnDef<MarketHistory>[] = [
  {
    accessorKey: "timestamp",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-gray-400 hover:text-logo-400"
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="text-white">{formatTimestamp(row.getValue("timestamp"))}</div>
    },
  },
  {
    accessorKey: "event_type",
    header: "Type",
    cell: ({ row }) => {
      return <div className="text-white">{row.getValue("event_type")}</div>
    },
  },
  {
    accessorKey: "delta",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-gray-400 hover:text-logo-400"
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const delta = row.getValue("delta") as string | null;
      const operation = row.original.operation;
      const displayValue = delta ? Number(delta) : 0;
      const sign = operation === "+" ? "+" : operation === "-" ? "-" : "";
      
      return <div className="text-white">{sign}{displayValue}</div>
    },
  },
  {
    accessorKey: "caller",
    header: "User",
    cell: ({ row }) => {
      const caller = row.getValue("caller") as string | null;
      return <CopiableAddress value={caller} />;
    },
  },
  {
    accessorKey: "tx_hash",
    header: "Transaction",
    cell: ({ row }) => {
      const txHash = row.getValue("tx_hash") as string;
      return <CopiableAddress value={txHash} />;
    },
  },
]
