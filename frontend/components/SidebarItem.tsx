"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarItemProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  href: string
}

export function SidebarItem({ icon: Icon, title, href }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link href={href}>
      <span
        className={cn(
          "group flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-800/60",
          isActive ? "bg-gray-800/60 text-gray-200" : "text-gray-400 hover:text-gray-200"
        )}
      >
        {Icon && <Icon className={cn("mr-2 h-4 w-4", isActive ? "text-gray-200" : "text-gray-400")} />}
        <span>{title}</span>
      </span>
    </Link>
  )
} 
