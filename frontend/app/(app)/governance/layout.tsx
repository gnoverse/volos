"use client"

import { GovMemberCards } from "@/components/gov-member-cards"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"
const queryClient = new QueryClient()

function GovernanceLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="items-center justify-center space-y-6 -mt-6 py-6 relative">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[36px] font-bold text-gray-300">
          Governance
        </h1>
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
