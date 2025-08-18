"use client"

import { GovMemberCards } from "@/components/gov-member-cards"
import { Button } from "@/components/ui/button"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Users } from "lucide-react"
import Link from "next/link"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"
const queryClient = new QueryClient()

function GovernanceLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="items-center justify-center space-y-6 -mt-6 py-6 relative">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[36px] font-bold text-gray-300">
          Governance
        </h1>
        <Link href="/governance/delegates">
          <Button variant="outline" className="bg-transparent border-gray-500 text-gray-300 hover:border-logo-500 hover:text-logo-500">
            <Users className="w-4 h-4 mr-2" />
            Manage Delegates & Withdrawals
          </Button>
        </Link>
      </div>
      
      <div className="flex gap-6">
        {/* Left side - Content (2/3 width) */}
        <div className="flex-1 w-2/3">
          {children}
        </div>

        {/* Right side - User Info (1/3 width) */}
        <div className="w-1/3 flex-shrink-0">
          <div className="space-y-6">
            <GovMemberCards
              cardStyles={CARD_STYLES}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GovernanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <GovernanceLayoutContent>
        {children}
      </GovernanceLayoutContent>
    </QueryClientProvider>
  )
}
