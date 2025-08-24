"use client"


import { formatTimestamp, getXAxisFormatter } from "@/app/utils/format.utils"
import { ChartDropdown, TimePeriod } from "@/components/chart-dropdown"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useSupplyBorrowData } from "@/hooks/use-supply-borrow-data"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import useLocalStorageState from "use-local-storage-state"

interface SupplyBorrowChartProps {
  marketId: string
  title?: string
  description?: string
  className?: string
}

export function SupplyBorrowChart({
  marketId,
  title = "Supply & Borrow",
  description = "Compare total supply and borrow amounts over time",
  className,
}: SupplyBorrowChartProps) {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>("1 week")
  const [selectedMetrics, setSelectedMetrics] = useLocalStorageState('supply-borrow-chart-metrics', {
    defaultValue: {
      supply: true,
      borrow: true,
    }
  })

  const { transformedData, isLoading, hasData } = useSupplyBorrowData(marketId, selectedTimePeriod, selectedMetrics)

  if (isLoading) {
    return (
      <Card className={cn("bg-gray-700/60 border-none rounded-3xl", className)}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              {title && <CardTitle className="text-logo-600">{title}</CardTitle>}
              {description && <CardDescription className="text-gray-400">{description}</CardDescription>}
            </div>
            <ChartDropdown
              selectedTimePeriod={selectedTimePeriod}
              onTimePeriodChangeAction={setSelectedTimePeriod}
            />
          </div>
        </CardHeader>
        <CardContent className="-px-6">
          <div className="flex items-center justify-center h-[300px] text-gray-400">
            Loading chart data...
          </div>
        </CardContent>
      </Card>
    )
  }



  if (!hasData) {
    return (
      <Card className={cn("bg-gray-700/60 border-none rounded-3xl", className)}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              {title && <CardTitle className="text-logo-600">{title}</CardTitle>}
              {description && <CardDescription className="text-gray-400">{description}</CardDescription>}
            </div>
            <ChartDropdown
              selectedTimePeriod={selectedTimePeriod}
              onTimePeriodChangeAction={setSelectedTimePeriod}
            />
          </div>
        </CardHeader>
        <CardContent className="-px-6">
          <div className="flex items-center justify-center h-[300px] text-gray-400">
            No data available for this time period
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("bg-gray-700/60 border-none rounded-3xl", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            {title && <CardTitle className="text-logo-600">{title}</CardTitle>}
            {description && <CardDescription className="text-gray-400">{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-4">
            {/* Metric Selection Checkboxes */}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedMetrics.supply}
                  onCheckedChange={() => setSelectedMetrics(prev => ({ ...prev, supply: !prev.supply }))}
                  className="bg-customGray-800/55 border-gray-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                <span className="text-green-400">Supply</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedMetrics.borrow}
                  onCheckedChange={() => setSelectedMetrics(prev => ({ ...prev, borrow: !prev.borrow }))}
                  className="bg-customGray-800/55 border-gray-600 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                />
                <span className="text-red-400">Borrow</span>
              </div>
            </div>
            <ChartDropdown
              selectedTimePeriod={selectedTimePeriod}
              onTimePeriodChangeAction={setSelectedTimePeriod}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="-px-6">
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart
              data={transformedData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <XAxis 
                dataKey="timestamp"
                fontSize={10}
                tickLine={false}
                tickFormatter={getXAxisFormatter(selectedTimePeriod)}
                height={50}
                interval={7}
                tick={{ textAnchor: 'start', fill: 'rgb(156 163 175)' }}
                tickMargin={5}
                stroke="rgba(75, 85, 99, 0.3)"
              />
              
              <YAxis 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={60}
                tick={{ fill: 'rgb(156 163 175)' }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                stroke="rgba(75, 85, 99, 0.3)"
              />
              
              {selectedMetrics.supply && (
                <Line
                  type="monotone"
                  dataKey="supply"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={true}
                  style={{ filter: `drop-shadow(0 0 6px rgb(34, 197, 94))` }}
                />
              )}
              
              {selectedMetrics.borrow && (
                <Line
                  type="monotone"
                  dataKey="borrow"
                  stroke="rgb(239, 68, 68)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={true}
                  style={{ filter: `drop-shadow(0 0 6px rgb(239, 68, 68))` }}
                />
              )}
              
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(31, 41, 55, 0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(75, 85, 99, 0.4)',
                  borderRadius: '0.5rem',
                  color: 'rgb(156 163 175)',
                }} 
                labelFormatter={(label) => formatTimestamp(label)}
                formatter={(value) => [`${(Number(value) / 1000000).toFixed(2)}M`]}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
