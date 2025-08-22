"use client"

import { TotalBorrowData, TotalSupplyData, UtilizationData } from "@/app/services/api.service"
import { formatShortDate, formatTimestamp, getTimePeriodStartDate } from "@/app/utils/format.utils"
import { ChartDropdown, TimePeriod } from "@/components/chart-dropdown"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useMemo, useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type TokenChartData = TotalSupplyData | TotalBorrowData | UtilizationData

interface TokenChartProps {
  data: Array<TokenChartData>
  title: string
  description: string
  color?: string
  className?: string
  decimals?: number
  onTimePeriodChangeAction: (period: TimePeriod) => void
}

export function Chart({
  data,
  title,
  description,
  color = "rgb(99, 102, 241)",
  className,
  decimals = 6,
  onTimePeriodChangeAction,
}: TokenChartProps) {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>("1 month")

  // Filter data based on selected time period
  const filteredData = useMemo(() => {
    const startTime = getTimePeriodStartDate(selectedTimePeriod)
    return data.filter(item => {
      const itemDate = new Date(item.timestamp)
      return itemDate >= startTime
    })
  }, [data, selectedTimePeriod])

  // Handle time period change
  const handleTimePeriodChange = (period: TimePeriod) => {
    setSelectedTimePeriod(period)
    onTimePeriodChangeAction(period)
  }

  const transformedData = filteredData.map(item => {
    const rawValue = (item as TokenChartData).value;

    // TODO: this is a workaround to handle large numbers that are stored as strings which are uint256.
    // Number type is 64 bit meaning this won't work for numbers larger than 2^53.
    // TODO: find a better way to handle this.
    if (typeof rawValue === 'string') { 
      const bigValue = Number(rawValue);
      const divisor = Math.pow(10, decimals);
      return {
        ...item,
        value: bigValue / divisor
      };
    }
    
    return {
      ...item,
      value: rawValue
    };
  })

  return (
    <Card className={cn("bg-gray-700/60 border-none rounded-3xl", className)}>
      {(title || description) && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              {title && <CardTitle className="text-logo-600">{title}</CardTitle>}
              {description && <CardDescription className="text-gray-400">{description}</CardDescription>}
            </div>
            <ChartDropdown
              onTimePeriodChangeAction={handleTimePeriodChange}
            />
          </div>
        </CardHeader>
      )}
      <CardContent className="-px-6">
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <LineChart
              data={transformedData}
              margin={{ top: 5, right: 10, bottom: 10, left: 10 }}
            >
              <XAxis 
                dataKey="timestamp"
                fontSize={10}
                tickLine={false}
                tickFormatter={(str) => {
                  return formatShortDate(str); //TODO: this should be formatted diferently if the period is all time
                }}
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
                width={35}
                tick={{ fill: 'rgb(156 163 175)' }}
                stroke="rgba(75, 85, 99, 0.3)"
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                style={{ filter: `drop-shadow(0 0 6px ${color})` }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(31, 41, 55, 0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(75, 85, 99, 0.4)',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }}
                labelStyle={{ color: 'rgb(156 163 175)' }}
                itemStyle={{ color: 'rgb(229 231 235)' }}
                labelFormatter={(label) => {
                  return formatTimestamp(label);
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 
