"use client"

import { ChartData as HistoryEvent } from "@/app/services/api.service"
import { formatTimestamp } from "@/app/utils/format.utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// TODO: fix this type
interface ChartProps {
  data: Array<HistoryEvent>
  title: string
  description: string
  dataKey: string
  color?: string
  className?: string
}

export function Chart({
  data,
  title,
  description,
  dataKey,
  color = "rgb(99, 102, 241)",
  className
}: ChartProps) {
  return (
    <Card className={cn("bg-gray-700/60 border-none rounded-3xl", className)}>
      {(title || description) && (
        <CardHeader className="pb-4">
          {title && <CardTitle className="text-logo-600">{title}</CardTitle>}
          {description && <CardDescription className="text-gray-400">{description}</CardDescription>}
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
                stroke="rgba(75, 85, 99, 0.3)"
              />
              <Line
                type="monotone"
                dataKey={dataKey}
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
