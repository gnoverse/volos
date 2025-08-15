"use client"

import { useActiveProposals, useProposals } from "@/app/(app)/governance/queries-mutations"
import { Proposal } from "@/app/types"
import { GovMemberCards } from "@/components/gov-member-cards"
import { ProposalCard } from "@/components/proposal-card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"

interface ProposalsOverviewProps {
  cardStyles: string
}

export function ProposalsOverview({
  cardStyles,
}: ProposalsOverviewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAll, setShowAll] = useState(false)
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [limit] = useState<number>(5)
  
  const lastId = cursorStack.length > 0 ? cursorStack[cursorStack.length - 1] : undefined
  const allProposals = useProposals(limit, lastId)
  const activeProposals = useActiveProposals(limit, lastId)
  const proposalsPage = showAll ? allProposals.data : activeProposals.data
  const isLoadingProposals = showAll ? allProposals.isLoading : activeProposals.isLoading

  useEffect(() => { setCursorStack([]) }, [showAll])

  return (
    <div className="flex gap-6">
      {/* Left side - Proposals (2/3 width) */}
      <div className="flex-1 w-2/3">
        <div className={`${cardStyles} p-6 border-l-4 border-logo-500`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-logo-500">Proposals</h3>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 bg-gray-800/60 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:border-logo-500 focus:ring-1 focus:ring-logo-500 text-sm"
              />
              <label className="flex items-center gap-2">
                <span className="text-gray-300 text-sm">Show all proposals</span>
                <Switch
                  checked={showAll}
                  onCheckedChange={setShowAll}
                  className="bg-transparent data-[state=checked]:border-logo-500 data-[state=unchecked]:border-gray-500 [&>span]:data-[state=checked]:bg-logo-500 [&>span]:data-[state=unchecked]:bg-gray-400"
                  aria-label="Show all proposals"
                />
              </label>
              <Button
                variant="outline"
                onClick={() => setCursorStack(prev => (prev.length > 0 ? prev.slice(0, -1) : prev))}
                disabled={cursorStack.length === 0 || isLoadingProposals}
                className="bg-transparent border-gray-500 text-gray-300 hover:border-logo-500 hover:text-logo-500 disabled:border-gray-600 disabled:text-gray-500 disabled:hover:border-gray-600 disabled:hover:text-gray-500"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (proposalsPage?.last_id) {
                    setCursorStack(prev => [...prev, proposalsPage.last_id])
                  }
                }}
                disabled={!proposalsPage?.has_more || isLoadingProposals}
                className="bg-transparent border-gray-500 text-gray-300 hover:border-logo-500 hover:text-logo-500 disabled:border-gray-600 disabled:text-gray-500 disabled:hover:border-gray-600 disabled:hover:text-gray-500"
              >
                Next
              </Button>
            </div>
          </div>

          {isLoadingProposals ? (
            <div className="text-gray-400 py-6">Loading proposals...</div>
          ) : proposalsPage && proposalsPage.proposals && proposalsPage.proposals.length > 0 ? (
            <div className="space-y-4">
              {proposalsPage.proposals.map((proposal: Proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          ) : (
            <div className="text-gray-400 py-6">No proposals found.</div>
          )}
        </div>
      </div>

      {/* Right side - User Info (1/3 width) */}
      <div className="w-1/3 flex-shrink-0">
        <div className="space-y-6">
          <GovMemberCards
            cardStyles={cardStyles}
          />
        </div>
      </div>
    </div>
  )
}
