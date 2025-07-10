"use client"

import { ChartData } from "@/app/services/api.service"
import { cn } from "@/lib/utils"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface PositionChartProps {
  data: ChartData[]
  dataKey: "collateral" | "borrowed" | "healthFactor"
  color?: string
  className?: string
}

export function PositionChart({
  data,
  dataKey,
  color = "rgb(99, 102, 241)",
  className
}: PositionChartProps) {
  return (
    <div className={cn("w-full", className)}>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, bottom: 10, left: 10 }}
          >
            <XAxis 
              dataKey="name"
              fontSize={10}
              tickLine={false}
              tickFormatter={(str) => {
                const date = new Date(str)
                return date.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
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
                const date = new Date(label)
                return date.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 
