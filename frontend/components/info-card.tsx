"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface InfoCardProps {
  title: string
  value?: ReactNode
  description?: string
  icon?: ReactNode
  className?: string
  children?: ReactNode
}

export function InfoCard({
  title,
  value,
  description,
  icon,
  className,
  children,
}: InfoCardProps) {
  return (
    <Card className={cn("bg-gray-700/60 border-none rounded-3xl", className)}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-gray-200 text-base font-medium">{title}</CardTitle>
          {description && (
            <CardDescription className="text-gray-400">{description}</CardDescription>
          )}
        </div>
        {icon && <div className="ml-2">{icon}</div>}
      </CardHeader>
      <CardContent>
        {value && (
          <div className="text-2xl font-semibold text-gray-200 mb-2">{value}</div>
        )}
        {children}
      </CardContent>
    </Card>
  )
} 