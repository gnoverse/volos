"use client"

import { useExecuteProposalMutation, useProposal, useUserVoteOnProposal, useVoteMutation, useXVLSBalance } from "@/app/(app)/governance/queries-mutations"
import { useUserAddress } from "@/app/utils/address.utils"
import { formatTimestamp } from "@/app/utils/format.utils"
import { getProposalStatusColor } from "@/app/utils/ui.utils"
import CopiableAddress from "@/components/copiable-addess"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, CheckCircle, Clock, PlayCircle, User, Vote, XCircle } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"

export default function ProposalDetailPage() {
  const params = useParams()
  const proposalId = params.proposalId as string
  const { data: proposal, isLoading, error, refetch: refetchProposal } = useProposal(proposalId)
  const voteMutation = useVoteMutation()
  const [votingReason, setVotingReason] = useState("")
  const [isVoting, setIsVoting] = useState(false)
    
  const { userAddress, isConnected } = useUserAddress()
  const { data: xvlsBalance = { address: userAddress, balance: 0 } } = useXVLSBalance(userAddress)
  const { data: userVote, refetch: refetchUserVote } = useUserVoteOnProposal(proposalId, userAddress)
  const executeMutation = useExecuteProposalMutation()

  const handleVote = async (choice: 'YES' | 'NO' | 'ABSTAIN') => {
    if (!proposal) return
    
    setIsVoting(true)
    try {
      await voteMutation.mutateAsync({
        proposalId: proposal.id,
        choice,
        reason: votingReason
      })

      setVotingReason("")
      setTimeout(async () => {
        await Promise.all([
          refetchUserVote(),
          refetchProposal()
        ])
      }, 1000) 
      
    } catch (error) {
      console.error("Voting failed:", error)
    } finally {
      setIsVoting(false)
    }
  }

  const isQuorumMet = proposal && proposal.total_votes >= proposal.quorum
  const isPassed = proposal && proposal.yes_votes > proposal.no_votes
  const isActive = proposal?.status === 'active'
  const deadlineDate = proposal ? new Date(proposal.deadline) : null
  const isExpired = deadlineDate ? new Date() > deadlineDate : false
  const canVote = isConnected && xvlsBalance.balance > 0
  const isExecutable = !!(isExpired && isQuorumMet && isPassed)
  const isExecutedOrNonActive = !!proposal && !isActive
  const willFail = isExpired && (!isQuorumMet || !isPassed)

  const handleExecute = async () => {
    if (!proposal) return
    try {
      await executeMutation.mutateAsync({ proposalId: proposal.id })
    } catch (err) {
      console.error('Execute proposal failed:', err)
    }
  }

  if (isLoading) {
    return (
      <div className={`${CARD_STYLES} p-6 border-l-4 border-logo-500`}>
        <div className="text-gray-400 py-6">Loading proposal...</div>
      </div>
    )
  }

  if (error || !proposal) {
    return (
      <div className={`${CARD_STYLES} p-6 border-l-4 border-red-500`}>
        <div className="text-red-400 py-6">
          {error ? "Failed to load proposal" : "Proposal not found"}
        </div>
        <Link href="/governance">
          <Button variant="outline" className="mt-4 bg-transparent border-gray-500 text-gray-300 hover:border-logo-500 hover:text-logo-500">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Governance
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main proposal card */}
      <Card className={`${CARD_STYLES} border-l-4 border-logo-500`}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              {/* Back button moved to layout header */}
              <CardTitle className="text-orange-500 font-semibold text-2xl leading-tight flex-1">
                {proposal.title}
                <span className="text-sm text-gray-500 font-normal ml-2">[#{proposal.id}]</span>
              </CardTitle>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ml-4 flex-shrink-0 border ${getProposalStatusColor(proposal.status)}`}>
              {proposal.status.toUpperCase()}
            </span>
          </div>
          <div className="">
            <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span className="flex items-center gap-1">
                  <span>Proposed by:</span>
                  <CopiableAddress value={proposal.proposer} short className="text-gray-300" />
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                                  <span>Created: {formatTimestamp(new Date(proposal.created_at).getTime())}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Deadline: {formatTimestamp(new Date(proposal.deadline).getTime())}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Proposal body */}
          <div>
            <h3 className="text-lg font-medium text-gray-200 mb-3">Description</h3>
            <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50">
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {proposal.body}
              </p>
            </div>
          </div>

          <Separator className="bg-gray-600/50" />

          {/* Voting statistics */}
          <div>
            <h3 className="text-lg font-medium text-gray-200 mb-4">Voting Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">Yes Votes</div>
                <div className="text-xl font-semibold text-green-400">{proposal.yes_votes}</div>
              </div>
              <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">No Votes</div>
                <div className="text-xl font-semibold text-red-400">{proposal.no_votes}</div>
              </div>
              <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">Abstain</div>
                <div className="text-xl font-semibold text-yellow-400">{proposal.abstain_votes}</div>
              </div>
              <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">Total Votes</div>
                <div className="text-xl font-semibold text-gray-200">{proposal.total_votes}</div>
              </div>
            </div>

            {/* Quorum status */}
            <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Quorum Required</div>
                  <div className="text-lg font-medium text-gray-200">{proposal.quorum} xVLS</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isQuorumMet 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}>
                  {isQuorumMet ? 'Quorum Met' : 'Quorum Required'}
                </div>
              </div>
            </div>
          </div>

          {/* Show user's previous vote if they have voted */}
          {userVote && isConnected && (
            <>
              <Separator className="bg-gray-600/50" />
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">Your Vote</h3>
                <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userVote.vote_choice === 'YES' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : userVote.vote_choice === 'NO'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {userVote.vote_choice}
                      </span>
                      <span className="text-gray-300 text-sm">
                        with {userVote.xvls_amount} xVLS
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(new Date(userVote.timestamp).getTime())}
                    </span>
                  </div>
                  {userVote.reason && (
                    <div className="mt-2">
                      <div className="text-sm text-gray-400 mb-1">Reason:</div>
                      <div className="text-gray-300 text-sm italic">
                        &ldquo;{userVote.reason}&rdquo;
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Voting section - only show if proposal is active */}
          {isActive && !isExpired && (
            <>
              <Separator className="bg-gray-600/50" />
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-4 flex items-center gap-2">
                  <Vote className="w-5 h-5" />
                  {userVote ? 'Change Your Vote' : 'Cast Your Vote'}
                </h3>
                
                {/* Show voting requirements if user can't vote */}
                {!canVote && (
                  <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-sm">
                      {!isConnected 
                        ? "Connect your wallet to vote on this proposal" 
                        : "You need xVLS tokens to vote on this proposal"
                      }
                    </p>
                  </div>
                )}
                
                {/* Optional voting reason */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">
                    Voting Reason (Optional)
                  </label>
                  <textarea
                    value={votingReason}
                    onChange={(e) => setVotingReason(e.target.value)}
                    placeholder="Share your reasoning for this vote..."
                    className="w-full px-3 py-2 bg-gray-800/60 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:border-logo-500 focus:ring-1 focus:ring-logo-500 resize-none disabled:opacity-50"
                    rows={3}
                    maxLength={500}
                    disabled={!canVote}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {votingReason.length}/500 characters
                  </div>
                </div>

                {/* Voting buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleVote('YES')}
                    disabled={isVoting || !canVote}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white border-none disabled:bg-gray-600 disabled:text-gray-400"
                  >
                    {isVoting ? 'Voting...' : 'Vote Yes'}
                  </Button>
                  <Button
                    onClick={() => handleVote('NO')}
                    disabled={isVoting || !canVote}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none disabled:bg-gray-600 disabled:text-gray-400"
                  >
                    {isVoting ? 'Voting...' : 'Vote No'}
                  </Button>
                  <Button
                    onClick={() => handleVote('ABSTAIN')}
                    disabled={isVoting || !canVote}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white border-none disabled:bg-gray-600 disabled:text-gray-400"
                  >
                    {isVoting ? 'Voting...' : 'Abstain'}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Show message if voting is not available */}
          {(!isActive || isExpired) && (
            <>
              <Separator className="bg-gray-600/50" />
              <div className="bg-gradient-to-r from-gray-800/60 to-gray-800/30 rounded-xl p-5 border border-gray-700/50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {isExecutedOrNonActive || isExecutable ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className={`w-5 h-5 ${isExpired ? 'text-yellow-400' : 'text-gray-400'}`} />
                    )}
                    <div className="text-left">
                      <div className="text-gray-200 font-medium">
                        {isExecutedOrNonActive
                          ? 'Proposal executed'
                          : (isExpired ? (isExecutable ? 'Ready to Execute' : (willFail ? 'Proposal Failed' : 'Voting period has ended')) : 'Voting is not available')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {isExecutedOrNonActive
                          ? `Status: ${proposal.status.toUpperCase()}`
                          : (isExpired
                              ? (isExecutable
                                  ? 'Quorum met and majority voted YES'
                                  : (willFail
                                      ? (isQuorumMet
                                          ? 'Quorum met, but proposal did not pass'
                                          : 'Quorum not met')
                                      : 'Voting period has ended'))
                              : 'This proposal cannot be voted on at this time')}
                      </div>
                    </div>
                  </div>

                  {(isExpired || isExecutedOrNonActive) && (
                    <Button
                      onClick={handleExecute}
                      disabled={executeMutation.isPending || isExecutedOrNonActive || !isConnected}
                      title={isExecutedOrNonActive ? 'Proposal already executed' : (!isConnected ? 'Connect your wallet to execute this proposal' : undefined)}
                      className="bg-logo-500 hover:bg-logo-600 text-white border-none disabled:bg-gray-700 disabled:text-gray-400 flex items-center gap-2"
                    >
                      {executeMutation.isPending ? 'Executing...' : (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          {willFail ? 'Clear Proposal' : 'Execute Proposal'}
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {willFail && isActive && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-xs">
                      <strong>Note:</strong> This will update the proposal status by triggering Execute function, but will not actually execute the proposal since it did not pass.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
