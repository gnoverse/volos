import { AdenaService } from '@/app/services/adena.service'
import { useCallback, useEffect, useState } from 'react'

/**
 * Custom hook that manages user address state and listens for address changes.
 * Automatically updates when the user connects/disconnects their wallet.
 * 
 * @returns Object containing userAddress, isConnected state, and wallet connection handler
 */
export function useUserAddress() {
  const [userAddress, setUserAddress] = useState<string>("")
  const [isConnected, setIsConnected] = useState<boolean>(false)

  useEffect(() => {
    const adena = AdenaService.getInstance()
    
    const initializeConnection = async () => {
      const connected = adena.isConnected()
      const address = adena.getAddress()
      
      setUserAddress(address)
      setIsConnected(connected)
    }
    
    initializeConnection()

    const handleAddressChange = (event: CustomEvent) => {
      const newAddress = event.detail?.newAddress || ""
      setUserAddress(newAddress)
      setIsConnected(!!newAddress)
    }

    window.addEventListener("adenaAddressChanged", handleAddressChange as EventListener)

    return () => {
      window.removeEventListener("adenaAddressChanged", handleAddressChange as EventListener)
    }
  }, [])

  const handleWalletConnection = useCallback(async () => {
    const adenaService = AdenaService.getInstance()
    
    if (isConnected) {
      adenaService.disconnectWallet()
    } else {
      await adenaService.connectWallet()
    }
  }, [isConnected])

  return { userAddress, isConnected, handleWalletConnection }
}
