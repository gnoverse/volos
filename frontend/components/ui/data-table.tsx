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
import { useState } from "react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pagination?: boolean
  sorting?: boolean
  className?: string
  getRowId?: (row: TData) => string
  onRowClick?: (id: string) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination = true,
  sorting = true,
  className,
  getRowId,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sortingState, setSortingState] = useState<SortingState>([])
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: sorting ? getSortedRowModel() : undefined,
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
                      "text-gray-200 h-12",
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
                className="bg-gray-700/40 hover:bg-gray-600/60 my-1 border-none transition-colors rounded-3xl cursor-pointer"
                onClick={() => onRowClick?.(row.id)}
              >
                {row.getVisibleCells().map((cell, index) => (
                  <TableCell 
                    key={cell.id} 
                    className={cn(
                      "text-gray-200 h-18",
                      index === 0 && "rounded-l-xl",
                      index === row.getVisibleCells().length - 1 && "rounded-r-xl"
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="rounded-3xl">
              <TableCell colSpan={columns.length} className="h-24 text-center text-gray-400 rounded-3xl">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {pagination && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="text-gray-200 hover:text-gray-100 hover:bg-gray-600/60 rounded-3xl"
          >
            Previous
          </Button>
          <span className="mx-2 text-gray-200">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="text-gray-200 hover:text-gray-100 hover:bg-gray-600/60 rounded-3xl"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
} 
