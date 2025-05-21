"use client"

import * as TabsPrimitive from "@radix-ui/react-tabs"
import * as React from "react"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "flex flex-row w-full items-center rounded-xl p-1.5 gap-1",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "text-gray-400 flex items-center justify-center gap-1.5 rounded-lg px-3 py-0.5 text-base font-medium whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-customGray-700/60 data-[state=active]:font-medium",
        "hover:bg-customGray-700/30 hover:text-gray-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "group",
        className
      )}
      {...props}
    >
      <span className="transition-transform duration-0 group-hover:scale-105 group-data-[state=active]:scale-110">
        {props.children}
      </span>
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger }

