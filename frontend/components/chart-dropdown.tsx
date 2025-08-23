"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"


export type TimePeriod = "1 week" | "1 month" | "3 months" | "6 months" | "all time"

interface ChartDropdownProps {
  selectedTimePeriod: TimePeriod
  onTimePeriodChangeAction: (period: TimePeriod) => void
}

export function ChartDropdown({ selectedTimePeriod, onTimePeriodChangeAction }: ChartDropdownProps) {
  const onTimePeriodChange = (period: TimePeriod) => {
    onTimePeriodChangeAction(period)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-24 bg-customGray-800/55 border-none text-gray-200 hover:bg-gray-700/90 focus:ring-logo-500/50 rounded-full">
          <span className="text-right">{selectedTimePeriod}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-800/60 border-none text-gray-100" align="end">
        <DropdownMenuItem onClick={() => onTimePeriodChange("1 week")} className="hover:bg-gray-700/90 border-none hover:text-logo-400 focus:bg-gray-700/90 focus:text-logo-400">
          1 week
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onTimePeriodChange("1 month")} className="hover:bg-gray-700/90 border-none hover:text-logo-400 focus:bg-gray-700/90 focus:text-logo-400">
          1 month
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onTimePeriodChange("3 months")} className="hover:bg-gray-700/90 border-none hover:text-logo-400 focus:bg-gray-700/90 focus:text-logo-400">
          3 months
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onTimePeriodChange("6 months")} className="hover:bg-gray-700/90 border-none hover:text-logo-400 focus:bg-gray-700/90 focus:text-logo-400">
          6 months
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onTimePeriodChange("all time")} className="hover:bg-gray-700/90 border-none hover:text-logo-400 focus:bg-gray-700/90 focus:text-logo-400">
          all time
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
