"use client"

import { Proposal } from "@/app/services/api.service"
import { getProposalStatusColor } from "@/app/utils/format.utils"
import CopiableAddress from "@/components/copiable-addess"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface ProposalCardProps {
  proposal: Proposal
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  return (
    <Link href={`/governance/${proposal.id}`} className="block">
      <Card className="bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/60 transition-colors cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-gray-200 font-medium text-base leading-tight">
              {proposal.title}
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm mt-2 line-clamp-2">
              {proposal.body}
            </CardDescription>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ml-3 flex-shrink-0 border ${getProposalStatusColor(proposal.status)}`}>
            {proposal.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span className="flex items-center gap-1">
            <span>Proposed by:</span>
            <span
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <CopiableAddress value={proposal.proposer} short className="text-gray-300" />
            </span>
          </span>
          <span>
            Quorum: {proposal.quorum} xVLS
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>Yes: {proposal.yes_votes}</span>
            <span>No: {proposal.no_votes}</span>
            <span>Abstain: {proposal.abstain_votes}</span>
          </div>
          <span className={`font-medium ${
            proposal.total_votes >= proposal.quorum 
              ? 'text-green-400' 
              : 'text-yellow-400'
          }`}>
            {proposal.total_votes >= proposal.quorum ? 'Quorum Met' : 'Quorum Required'}
          </span>
        </div>
      </CardContent>
    </Card>
    </Link>
  )
}
