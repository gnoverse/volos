import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"

interface DaoMembership {
  isMember: boolean
  xVLSBalance: string
}

interface VotingPower {
  power: string
  canPropose: boolean
  proposalThreshold: string
}

interface GovMemberCardsProps {
  daoMembership: DaoMembership
  votingPower: VotingPower
  isLoading: boolean
  cardStyles: string
}

export function GovMemberCards({ 
  daoMembership, 
  votingPower, 
  isLoading, 
  cardStyles 
}: GovMemberCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* DAO Membership Card */}
      <div className={`${cardStyles} p-6 border-l-4 border-logo-500`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-logo-500">DAO Membership</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info size={20} className="text-gray-400 hover:text-gray-300 hover:bg-gray-700/60 rounded-full p-1 cursor-default transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-gray-300 border-none shadow-lg">
                <p className="max-w-xs">
                  You are a member of the DAO if you hold xVLS tokens. To obtain xVLS you need to stake VLS tokens.
                  xVLS tokens represent your governance power and voting rights.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-600 rounded w-1/2"></div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                daoMembership.isMember 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {daoMembership.isMember ? 'Member' : 'Not a Member'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">xVLS Balance:</span>
              <span className="text-gray-200 font-mono font-semibold">
                {daoMembership.xVLSBalance} xVLS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Voting Power Card */}
      <div className={`${cardStyles} p-6 border-l-4 border-logo-500`}>
        <h3 className="text-xl font-semibold text-logo-500 mb-4">Voting Power</h3>
        
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-600 rounded w-1/2"></div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Voting Power:</span>
              <span className="text-logo-500 font-mono font-semibold">
                {votingPower.power} xVLS
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Can Propose:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                votingPower.canPropose 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {votingPower.canPropose ? 'Eligible' : 'Not Eligible'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Proposal Threshold:</span>
              <span className="text-gray-200 font-mono">
                {votingPower.proposalThreshold} xVLS
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
