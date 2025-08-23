"use client"

import { APRData, UtilizationData } from "@/app/services/api.service"
import { formatShortDate } from "@/app/utils/format.utils"
import { ChartDropdown, TimePeriod } from "@/components/chart-dropdown"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useMemo, useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface UtilizationAPRChartProps {
  utilizationData: UtilizationData[]
  aprData: APRData[]
  title?: string
  description?: string
  className?: string
  selectedTimePeriod: TimePeriod
  onTimePeriodChangeAction: (period: TimePeriod) => void
}

export function UtilizationAPRChart({
  utilizationData,
  aprData,
  title = "Utilization & APR",
  description = "Compare utilization rate and APR trends",
  className,
  selectedTimePeriod,
  onTimePeriodChangeAction,
}: UtilizationAPRChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState({
    utilization: true,
    supplyApr: false,
    borrowApr: false,
  })

  // Transform and combine data
  const transformedData = useMemo(() => {
    const dataMap = new Map<number, {
      timestamp: number
      utilization?: number
      supplyApr?: number
      borrowApr?: number
    }>()

    // Add utilization data
    utilizationData.forEach(item => {
      const timestamp = new Date(item.timestamp).getTime()
      if (!dataMap.has(timestamp)) {
        dataMap.set(timestamp, { timestamp })
      }
      dataMap.get(timestamp)!.utilization = Number(item.value)
    })

    // Add APR data
    aprData.forEach(item => {
      const timestamp = new Date(item.timestamp).getTime()
      if (!dataMap.has(timestamp)) {
        dataMap.set(timestamp, { timestamp })
      }
      dataMap.get(timestamp)!.supplyApr = Number(item.supply_apr)
      dataMap.get(timestamp)!.borrowApr = Number(item.borrow_apr)
    })

    // Convert to array, filter by selected metrics, and sort by timestamp
    return Array.from(dataMap.values())
      .filter(item => {
        // Only include data points that have values for at least one selected metric
        if (selectedMetrics.utilization && item.utilization !== undefined) return true;
        if (selectedMetrics.supplyApr && item.supplyApr !== undefined) return true;
        if (selectedMetrics.borrowApr && item.borrowApr !== undefined) return true;
        return false;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      }, [utilizationData, aprData, selectedMetrics])

  const handleMetricToggle = (metric: keyof typeof selectedMetrics) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }))
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
                  onCheckedChange={() => handleMetricToggle('utilization')}
                  className="bg-customGray-800/55 border-gray-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <span className="text-blue-400">Utilization</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedMetrics.supplyApr}
                  onCheckedChange={() => handleMetricToggle('supplyApr')}
                  className="bg-customGray-800/55 border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <span className="text-blue-400">Supply APR</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedMetrics.borrowApr}
                  onCheckedChange={() => handleMetricToggle('borrowApr')}
                  className="bg-customGray-800/55 border-gray-600 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                />
                <span className="text-teal-400">Borrow APR</span>
              </div>
            </div>
            <ChartDropdown
              selectedTimePeriod={selectedTimePeriod}
              onTimePeriodChangeAction={onTimePeriodChangeAction}
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
                tickFormatter={(str) => formatShortDate(str)}
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
                tickFormatter={(value) => `${value}%`}
                stroke="rgba(75, 85, 99, 0.3)"
              />
              
              {selectedMetrics.utilization && (
                <Line
                  type="monotone"
                  dataKey="utilization"
                  stroke="rgb(99, 102, 241)"
                  strokeWidth={2}
                  dot={false}
                  style={{ filter: `drop-shadow(0 0 6px rgb(99, 102, 241))` }}
                />
              )}
              
              {selectedMetrics.supplyApr && (
                <Line
                  type="monotone"
                  dataKey="supplyApr"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth={2}
                  dot={false}
                  style={{ filter: `drop-shadow(0 0 6px rgb(59, 130, 246))` }}
                />
              )}
              
              {selectedMetrics.borrowApr && (
                <Line
                  type="monotone"
                  dataKey="borrowApr"
                  stroke="rgb(20, 184, 166)"
                  strokeWidth={2}
                  dot={false}
                  style={{ filter: `drop-shadow(0 0 6px rgb(20, 184, 166))` }}
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
                labelFormatter={(label) => formatShortDate(label)}
                formatter={(value, name) => [`${value}%`, name]}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
