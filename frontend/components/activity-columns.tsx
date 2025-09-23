import { Market, MarketHistory } from "@/app/types";
import { formatTimestamp } from "@/app/utils/format.utils";
import { CopiableAddress } from "@/components/copiable-addess";
import { ColumnDef } from "@tanstack/react-table";
import { formatUnits } from "viem";

export const createActivityColumns = (market: Market): ColumnDef<MarketHistory>[] => [
  {
    accessorKey: "timestamp",
    header: "Date",
    enableSorting: false,
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
    header: "Amount",
    enableSorting: false,
    cell: ({ row }) => {
      const delta = row.getValue("delta") as string | null;
      const operation = row.original.operation;
      const eventType = row.original.event_type;
      
      if (!delta) return <div className="text-white">0</div>;
      
      const decimals = (eventType === "SupplyCollateral" || eventType === "WithdrawCollateral") 
        ? market.collateral_token_decimals 
        : market.loan_token_decimals;
      
      const formattedValue = formatUnits(BigInt(delta), decimals);
      const sign = operation === "+" ? "+" : operation === "-" ? "-" : "";
      
      return <div className="text-white">{sign}{formattedValue}</div>
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
];
