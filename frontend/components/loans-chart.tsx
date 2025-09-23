"use client"

import { UserLoan } from "@/app/types"
import { formatShortDate, formatTimestamp } from "@/app/utils/format.utils"
import { getStableTimePeriodStartDateISO } from "@/app/utils/time.utils"
import { ChartDropdown, TimePeriod } from "@/components/chart-dropdown"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useMemo } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface LoansChartProps {
  data: UserLoan[]
  title: string
  description: string
  color?: string
  className?: string
  selectedTimePeriod: TimePeriod
  onTimePeriodChangeAction: (period: TimePeriod) => void
}

export function LoansChart({
  data,
  title,
  description,
  color = "#D95C12",
  className,
  selectedTimePeriod,
  onTimePeriodChangeAction,
}: LoansChartProps) {

  // Filter data based on selected time period
  const filteredData = useMemo(() => {
    const startTime = getStableTimePeriodStartDateISO(selectedTimePeriod)
    return data.filter(item => {
      const itemDate = new Date(item.timestamp)
      return itemDate >= new Date(startTime)
    })
  }, [data, selectedTimePeriod])

  // Handle time period change
  const handleTimePeriodChange = (period: TimePeriod) => {
    onTimePeriodChangeAction(period)
  }

  // Transform data for the chart
  const transformedData = filteredData.map(item => ({
    ...item,
    value: parseFloat(item.value),
    timestamp: new Date(item.timestamp)
  }))

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
              selectedTimePeriod={selectedTimePeriod}
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
                  return formatShortDate(str);
                }}
                stroke="#6B7280"
              />
              <YAxis 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                stroke="#6B7280"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as UserLoan;
                    return (
                      <div className="bg-gray-800/90 border border-gray-600 rounded-lg p-3 shadow-lg">
                        <p className="text-gray-300 text-sm">
                          {formatTimestamp(Number(label))}
                        </p>
                        <p className="text-white font-semibold">
                          ${parseFloat(data.value).toFixed(2)}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {data.eventType} • {data.loan_token_symbol} / {data.collateral_token_symbol}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
