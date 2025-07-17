"use client"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pagination?: boolean
  sorting?: boolean
  className?: string
  getRowId?: (row: TData) => string
  onRowClick?: (id: string) => void
  centered?: boolean
  clickable?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination = true,
  sorting = true,
  className,
  getRowId,
  onRowClick,
  centered = true,
  clickable = false,
}: DataTableProps<TData, TValue>) {
  const [sortingState, setSortingState] = useState<SortingState>([])
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sorting ? getSortedRowModel() : undefined,
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    state: {
      sorting: sortingState,
      pagination: paginationState,
    },
    onSortingChange: setSortingState,
    onPaginationChange: setPaginationState,
    getRowId: getRowId,
  })

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-gray-700/60 border-none rounded-3xl">
              {headerGroup.headers.map((header, index) => {
                return (
                  <TableHead 
                    key={header.id} 
                    className={cn(
                      "text-gray-400 h-12",
                      centered ? "text-center" : "text-left",
                      index === 0 && "rounded-l-xl",
                      index === headerGroup.headers.length - 1 && "rounded-r-xl"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={cn(
                  "bg-gray-700/40 my-1 border-none transition-colors rounded-3xl hover:bg-logo-600/20 cursor-default",
                  clickable && "group",
                  centered ? undefined : undefined
                )}
                onClick={() => onRowClick?.(row.id)}
              >
                {row.getVisibleCells().map((cell, index) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "text-gray-300 h-12 text-base",
                      centered ? "text-center" : "text-left",
                      index === 0 && "rounded-l-xl",
                      index === row.getVisibleCells().length - 1 && "rounded-r-xl"
                    )}
                  >
                    <span className={clickable ? "group-hover:text-logo-400 transition-colors cursor-pointer" : undefined}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="rounded-3xl">
              <TableCell colSpan={columns.length} className={cn("h-24 text-gray-400 rounded-3xl", centered ? "text-center" : "text-left") }>
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {pagination && table.getPageCount() > 1 && (
        <div className="flex items-center justify-center space-x-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="text-gray-200 hover:text-gray-100 hover:bg-gray-600/60 rounded-full w-8 h-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </Button>
          <span className="text-gray-200">
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="text-gray-200 hover:text-gray-100 hover:bg-gray-600/60 rounded-full w-8 h-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </Button>
        </div>
      )}
    </div>
  )
} 
