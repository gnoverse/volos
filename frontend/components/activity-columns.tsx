import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

export type Activity = {
  date: number;
  type: string;
  amount: number;
  user: string;
  transaction: string;
};

export const activityColumns: ColumnDef<Activity>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => row.getValue("date"),
    enableSorting: true,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => row.getValue("type"),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => row.getValue("amount"),
    enableSorting: true,
  },
  {
    accessorKey: "user",
    header: "User",
    cell: ({ row }) => <UserCell value={row.getValue("user") as string} />,
  },
  {
    accessorKey: "transaction",
    header: "Transaction",
    cell: ({ row }) => <TransactionCell value={row.getValue("transaction") as string} />,
  },
] 

function TransactionCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const display = value.length > 15 ? value.slice(0, 15) + "..." : value;
  return (
    <button
      className={`text-left truncate max-w-[260px] cursor-pointer transition-colors ${copied ? 'text-green-500' : ''}`}
      title={value}
      onClick={async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      }}
      style={{ background: "none", border: "none", padding: 0 }}
    >
      {/* TODO: Replace with a toast notification instead of inline text */}
      {copied ? <span className="ml-2 text-xs">Copied!</span> : display}
    </button>
  );
}

function UserCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const display = value.length > 15 ? value.slice(0, 15) + "..." : value;
  return (
    <button
      className={`text-left truncate max-w-[180px] cursor-pointer transition-colors ${copied ? 'text-green-500' : ''}`}
      title={value}
      onClick={async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      }}
      style={{ background: "none", border: "none", padding: 0 }}
    >
      {/* TODO: Replace with a toast notification instead of inline text */}
      {copied ? <span className="ml-2 text-xs">Copied!</span> : display}
    </button>
  );
}