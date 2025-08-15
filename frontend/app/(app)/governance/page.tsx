"use client"

import { ProposalsOverview } from "@/components/proposals-overview"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"
const queryClient = new QueryClient()

function GovernancePageContent() {

  return (
    <div className="items-center justify-center space-y-6 -mt-6 py-6 relative">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[36px] font-bold text-gray-300">
          Governance
        </h1>
      </div>
      
      <ProposalsOverview
        cardStyles={CARD_STYLES}
      />
    </div>
  )
}

export default function GovernancePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <GovernancePageContent />
    </QueryClientProvider>
  )
}
