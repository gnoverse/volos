"use client"


import { formatPercentage, formatTimestamp, getXAxisFormatter, wadToPercentage } from "@/app/utils/format.utils"
import { ChartDropdown, TimePeriod } from "@/components/chart-dropdown"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useUtilizationAPRData } from "@/hooks/use-utilization-apr-data"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import useLocalStorageState from "use-local-storage-state"

interface UtilizationAPRChartProps {
  marketId: string
  title?: string
  description?: string
  className?: string
}

export function UtilizationAPRChart({
  marketId,
  title = "Utilization & APR",
  description = "Compare utilization rate and APR trends",
  className,
}: UtilizationAPRChartProps) {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>("1 week")
  const [selectedMetrics, setSelectedMetrics] = useLocalStorageState('utilization-apr-chart-metrics', {
    defaultValue: {
      utilization: true,
      supplyApr: false,
      borrowApr: false,
    }
  })

  const { transformedData, isLoading, hasData } = useUtilizationAPRData(marketId, selectedTimePeriod, selectedMetrics)

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
                  checked={selectedMetrics.utilization}
                  onCheckedChange={() => setSelectedMetrics(prev => ({ ...prev, utilization: !prev.utilization }))}
                  className="bg-customGray-800/55 border-gray-600 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                />
                <span className="text-indigo-400">Utilization</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedMetrics.supplyApr}
                  onCheckedChange={() => setSelectedMetrics(prev => ({ ...prev, supplyApr: !prev.supplyApr }))}
                  className="bg-customGray-800/55 border-gray-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <span className="text-blue-400">Supply APR</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedMetrics.borrowApr}
                  onCheckedChange={() => setSelectedMetrics(prev => ({ ...prev, borrowApr: !prev.borrowApr }))}
                  className="bg-customGray-800/55 border-gray-600 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                />
                <span className="text-teal-400">Borrow APR</span>
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
                tickFormatter={(value) => formatPercentage(wadToPercentage(value.toString()))}
                stroke="rgba(75, 85, 99, 0.3)"
              />
              
              {selectedMetrics.utilization && (
                <Line
                  type="monotone"
                  dataKey="utilization"
                  stroke="rgb(99, 102, 241)"
                  strokeWidth={2}
                  dot={false}
                  name="Utilization"
                />
              )}
              
              {selectedMetrics.supplyApr && (
                <Line
                  type="monotone"
                  dataKey="supplyApr"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth={2}
                  dot={false}
                  name="Supply APR"
                />
              )}
              
              {selectedMetrics.borrowApr && (
                <Line
                  type="monotone"
                  dataKey="borrowApr"
                  stroke="rgb(20, 184, 166)"
                  strokeWidth={2}
                  dot={false}
                  name="Borrow APR"
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
                formatter={(value, name) => {
                  return [formatPercentage(wadToPercentage(value.toString())), name]
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
