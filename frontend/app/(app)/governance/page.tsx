"use client"

import { AdenaService } from "@/app/services/adena.service"
import { GovMemberCards } from "@/components/gov-member-cards"
import { Button } from "@/components/ui/button"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { useActiveProposals, useProposals } from "./queries-mutations"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"
const queryClient = new QueryClient()

function GovernancePageContent() {
  const [userAddress, setUserAddress] = useState<string>("a")
  const [isLoading, setIsLoading] = useState(true)
  const [limit] = useState<number>(5)
  const [showAll, setShowAll] = useState<boolean>(false)
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const lastId = cursorStack.length > 0 ? cursorStack[cursorStack.length - 1] : undefined
  const allProposals = useProposals(limit, lastId)
  const activeProposals = useActiveProposals(limit, lastId)
  const proposalsPage = showAll ? allProposals.data : activeProposals.data
  const isLoadingProposals = showAll ? allProposals.isLoading : activeProposals.isLoading

  useEffect(() => { setCursorStack([]) }, [showAll])

  // mock data - will be replaced with actual contract calls
  const [daoMembership, setDaoMembership] = useState({
    isMember: false,
    xVLSBalance: "0"
  })
  const [votingPower, setVotingPower] = useState({
    power: "0",
    canPropose: false,
    proposalThreshold: "1000"
  })

  useEffect(() => {
    const adena = AdenaService.getInstance()
    setUserAddress(adena.getAddress())

    const handleAddressChange = (event: CustomEvent) => {
      setUserAddress(event.detail?.newAddress || "")
    }
    window.addEventListener("adenaAddressChanged", handleAddressChange as EventListener)

    return () => {
      window.removeEventListener("adenaAddressChanged", handleAddressChange as EventListener)
    }
  }, [])

  useEffect(() => {
    if (userAddress) {
      // simulate API calls
      setTimeout(() => {
        setDaoMembership({
          isMember: true, // mock: user is a member
          xVLSBalance: "1500"
        })
        setVotingPower({
          power: "1500",
          canPropose: true,
          proposalThreshold: "1000"
        })
        setIsLoading(false)
      }, 1000)
    } else {
      setIsLoading(false)
    }
  }, [userAddress])

  const handleRefetch = () => {
    setIsLoading(true)
    // add actual refetch logic here
    setTimeout(() => setIsLoading(false), 500)
  }

  return (
    <div className="items-center justify-center space-y-6 -mt-6 py-6 relative">
      {/* Refetch button  */}
      <Button 
        onClick={handleRefetch}
        className="absolute top-0 right-0 mt-2 mr-2 p-3 bg-gray-700/60 rounded-lg hover:bg-gray-600/80 transition-colors flex items-center gap-2 z-10"
        title="Refetch data"
        variant="outline"
        disabled={isLoading}
      >
        <RefreshCw size={20} className="text-gray-200" />
        <span className="text-sm text-gray-200 font-medium">Refetch Data</span>
      </Button>

      <h1 className="text-[36px] font-bold mb-6 text-gray-300">
        Governance
      </h1>
      
      {userAddress && (
        <div className="space-y-6">
          {/* Governance member cards */}
          <GovMemberCards
            daoMembership={daoMembership}
            votingPower={votingPower}
            isLoading={isLoading}
            cardStyles={CARD_STYLES}
          />
        </div>
      )}

        {/* Proposals (active/all with pagination) */}
        <div className={`${CARD_STYLES} p-6 border-l-4 border-logo-500`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-logo-500">Proposals</h3>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search proposals..."
                className="px-3 py-2 bg-gray-800/60 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:border-logo-500 focus:ring-1 focus:ring-logo-500 text-sm"
              />
              <label className="flex items-center gap-2">
                <span className="text-gray-300 text-sm">Show all proposals</span>
                <input
                  type="checkbox"
                  className="toggle before:bg-gray-300 checked:bg-logo-500 checked:border-logo-500"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  aria-label="Show all proposals"
                />
              </label>
              <Button
                variant="outline"
                onClick={() => setCursorStack(prev => (prev.length > 0 ? prev.slice(0, -1) : prev))}
                disabled={cursorStack.length === 0 || isLoadingProposals}
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
              >
                Next
              </Button>
            </div>
          </div>

          {isLoadingProposals ? (
            <div className="text-gray-400 py-6">Loading proposals...</div>
          ) : proposalsPage && proposalsPage.proposals.length > 0 ? (
            <div className="space-y-4">
              {proposalsPage.proposals.map((p) => (
                <div key={p.id} className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-gray-200 font-medium">{p.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'active'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : p.status === 'executed'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{p.body}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Proposed by: {p.proposer.slice(0, 8)}...{p.proposer.slice(-6)}</span>
                    <div className="flex items-center gap-4">
                      <span>Yes: {p.yes_votes}</span>
                      <span>No: {p.no_votes}</span>
                      <span>Abstain: {p.abstain_votes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 py-6">No proposals found.</div>
          )}
        </div>
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
