import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { CreateProposal } from "./create-proposal"

interface ProposalsCardProps {
  eligible: boolean
  cardStyles: string
  proposals?: Array<{
    id: string
    title: string
    description: string
    proposer: string
    forVotes: string
    againstVotes: string
    startTime: number
    endTime: number
    state: string
  }>
}

export function ProposalsCard({ 
  eligible, 
  cardStyles, 
  proposals = [], 
}: ProposalsCardProps) {
  const [showCreateProposal, setShowCreateProposal] = useState(false)

  const handleCreateProposal = () => {
    setShowCreateProposal(true)
  }

  const handleCloseCreateProposal = () => {
    setShowCreateProposal(false)
  }

  if (showCreateProposal) {
    return (
      <CreateProposal 
        onClose={handleCloseCreateProposal}
        cardStyles={cardStyles}
      />
    )
  }

  return (
    <div className={`${cardStyles} p-6 border-l-4 border-logo-500`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-logo-500">Active Proposals</h3>
        {eligible && (
          <Button
            onClick={handleCreateProposal}
            className="bg-logo-500 hover:bg-logo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            size="sm"
          >
            <Plus size={16} />
            Create Proposal
          </Button>
        )}
      </div>

      {proposals.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          <p>No active proposals at the moment.</p>
          <p className="text-sm mt-2">Check back later for governance proposals.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-gray-200 font-medium">{proposal.title}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  proposal.state === 'active' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : proposal.state === 'pending'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {proposal.state}
                </span>
              </div>
              
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                {proposal.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Proposed by: {proposal.proposer.slice(0, 8)}...{proposal.proposer.slice(-6)}</span>
                <div className="flex items-center gap-4">
                  <span>For: {proposal.forVotes}</span>
                  <span>Against: {proposal.againstVotes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 
