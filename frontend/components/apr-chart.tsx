"use client"

import { APRData } from "@/app/types"
import { formatTimestamp } from "@/app/utils/format.utils"
import { ChartDropdown, TimePeriod } from "@/components/chart-dropdown"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface APRChartProps {
  data: Array<APRData>
  title: string
  description: string
  className?: string
  selectedTimePeriod: TimePeriod
  onTimePeriodChangeAction: (period: TimePeriod) => void
}

export function APRChart({
  data,
  title,
  description,
  className,
  selectedTimePeriod,
  onTimePeriodChangeAction,
}: APRChartProps) {
  return (
    <Card className={cn("bg-gray-700/60 border-none rounded-3xl", className)}>
      {(title || description) && (
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              {title && <CardTitle className="text-logo-600">{title}</CardTitle>}
              {description && <CardDescription className="text-gray-400">{description}</CardDescription>}
            </div>
            <div className="flex gap-2">
              <div className="inline-flex items-center px-2 py-1 rounded-md border border-blue-400 text-xs font-medium text-blue-400 bg-transparent">
                <div className="w-2 h-0.5 bg-blue-400 rounded mr-1"></div>
                Supply APR
              </div>
              <div className="inline-flex items-center px-2 py-1 rounded-md border border-teal-400 text-xs font-medium text-teal-400 bg-transparent">
                <div className="w-2 h-0.5 bg-teal-400 rounded mr-1"></div>
                Borrow APR
              </div>
              <ChartDropdown
                selectedTimePeriod={selectedTimePeriod}
                onTimePeriodChangeAction={onTimePeriodChangeAction}
                />
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="-px-6">
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, bottom: 10, left: 10 }}
            >
              <XAxis 
                dataKey="timestamp"
                fontSize={10}
                tickLine={false}
                tickFormatter={(str) => {
                  return formatTimestamp(str);
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
                tickFormatter={(value) => `${value}%`}
                stroke="rgba(75, 85, 99, 0.3)"
              />
              <Line
                type="monotone"
                dataKey="supply_apr"
                stroke="rgb(59, 130, 246)"
                strokeWidth={2}
                dot={false}
                style={{ filter: `drop-shadow(0 0 6px rgb(59, 130, 246))` }}
              />
              <Line
                type="monotone"
                dataKey="borrow_apr"
                stroke="rgb(20, 184, 166)"
                strokeWidth={2}
                dot={false}
                style={{ filter: `drop-shadow(0 0 6px rgb(20, 184, 166))` }}
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
                formatter={(value: number, name: string) => {
                  const roundedValue = value.toFixed(2);
                  const label = name === 'supply_apr' ? 'Supply APR' : 'Borrow APR';
                  return [`${roundedValue}%`, label];
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 
