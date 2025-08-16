import { AdenaService } from '@/app/services/adena.service'
import { useEffect, useState } from 'react'

interface UseUserAddressOptions {
  /**
   * Whether to perform additional wallet validation by checking the account status.
   * This adds an async check to ensure the wallet is properly connected.
   */
  validateConnection?: boolean
}

/**
 * Custom hook that manages user address state and listens for address changes.
 * Automatically updates when the user connects/disconnects their wallet.
 * 
 * @param options Configuration options for the hook
 * @returns Object containing userAddress and isConnected state
 */
export function useUserAddress(options: UseUserAddressOptions = {}) {
  const [userAddress, setUserAddress] = useState<string>("")
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const { validateConnection = false } = options

  useEffect(() => {
    const adena = AdenaService.getInstance()
    
    const initializeConnection = async () => {
      let connected = adena.isConnected()
      let address = adena.getAddress()
      
      if (validateConnection && connected) {
        try {
          const account = await adena.getSdk().getAccount()
          if (!account?.data?.address) {
            adena.disconnectWallet()
            connected = false
            address = ""
          }
        } catch {
          adena.disconnectWallet()
          connected = false
          address = ""
        }
      }
      
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
  }, [validateConnection])

  return { userAddress, isConnected }
}
