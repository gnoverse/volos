"use client"

import { AdenaService } from "@/app/services/adena.service"
import { GovMemberCards } from "@/components/gov-member-cards"
import { ProposalsOverview } from "@/components/proposals-overview"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState } from "react"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"
const queryClient = new QueryClient()

function GovernancePageContent() {
  const [userAddress, setUserAddress] = useState<string>("a")
  const [isLoading, setIsLoading] = useState(true)

  // mock data - will be replaced with actual contract calls
  // replace with ABCI to xvls realm, only check the balance of the user
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

  return (
    <div className="items-center justify-center space-y-6 -mt-6 py-6 relative">
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
