import { MarketActivity } from "@/app/services/api.service";
import { formatTimestamp } from "@/app/utils/format.utils";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

export const activityColumns: ColumnDef<MarketActivity>[] = [
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
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      return <div className="text-white">{row.getValue("type")}</div>
    },
  },
  {
    accessorKey: "amount",
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
      const amount = row.getValue("amount") as string | null;
      return <div className="text-white">{amount ? Number(amount) : 0}</div>
    },
  },
  {
    accessorKey: "caller",
    header: "User",
    cell: ({ row }) => {
      const caller = row.getValue("caller") as string | null;
      const display = caller && caller.length > 15 ? caller.slice(0, 15) + "..." : caller || "-";
      
      return <CopyableCell value={caller} display={display} maxWidth="180px" />;
    },
  },
  {
    accessorKey: "hash",
    header: "Transaction",
    cell: ({ row }) => {
      const txHash = row.getValue("hash") as string;
      const display = txHash && txHash.length > 15 ? txHash.slice(0, 15) + "..." : txHash || "-";
      
      return <CopyableCell value={txHash} display={display} maxWidth="260px" />;
    },
  },
]

const CopyableCell = ({ value, display, maxWidth }: { value: string | null, display: string, maxWidth: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleClick = async () => {
    if (value) {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`text-left truncate cursor-pointer transition-colors text-white hover:text-logo-400 ${
        copied ? 'text-green-500' : ''
      }`}
      style={{ 
        background: "none", 
        border: "none", 
        padding: 0,
        maxWidth 
      }}
      title={value || ""}
    >
      {copied ? "Copied!" : display}
    </button>
  );
};
