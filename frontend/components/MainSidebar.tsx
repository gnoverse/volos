"use client"

import { AdenaService } from "@/app/services/adena.service"
import { Button } from "@/components/ui/button"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { BookOpenIcon, LogOutIcon, TrendingUpIcon, WalletIcon } from "lucide-react"
import { useEffect, useState } from "react"

const menuItems = [
  { name: "Borrow", href: "/borrow", icon: BookOpenIcon },
  { name: "Explore", href: "/explore", icon: TrendingUpIcon },
]

export function MainSidebar() {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  
  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`
  }
  
  useEffect(() => {
    const checkWalletConnection = async () => {
      const adenaService = AdenaService.getInstance()
      const connected = adenaService.isConnected()
      setIsConnected(connected)
      
      if (connected) {
        const address = adenaService.getAddress()
        if (address) {
          setWalletAddress(address)
        }
      }
    }
    
    checkWalletConnection()
  }, [])
  
  const handleWalletConnection = async () => {
    const adenaService = await AdenaService.getInstance()
    
    if (isConnected) {
      adenaService.disconnectWallet()
      setIsConnected(false)
      setWalletAddress("")
    } else {
      try {
        await adenaService.connectWallet()
        const address = adenaService.getAddress()
        if (address) {
          setWalletAddress(address)
        }
        setIsConnected(true)
      } catch (error) {
        console.error("Failed to connect wallet:", error)
      }
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="h-14 px-4">
        <span className="text-gray-200">Project Name</span>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <a href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-800/60">
        {isConnected ? (
          <div className="flex items-center justify-between bg-gray-800/60 px-3 py-2 rounded-lg">
            <span className="text-gray-400 text-sm">{formatAddress(walletAddress)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-transparent"
              onClick={handleWalletConnection}
              title="Disconnect wallet"
            >
              <LogOutIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            className="w-full bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 hover:text-gray-200"
            onClick={handleWalletConnection}
          >
            <WalletIcon className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
} 
