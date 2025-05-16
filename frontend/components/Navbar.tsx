"use client"

import { AdenaService } from "@/app/services/adena.service";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { LogOutIcon, WalletIcon } from "lucide-react";
import { usePathname } from 'next/navigation';
import { useEffect, useState } from "react";

const menuItems = [
  { name: "Borrow", href: "/borrow" },
  { name: "Explore", href: "/explore" },
]

export default function Navbar() {
  const pathname = usePathname();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  
  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };
  
  useEffect(() => {
    const adenaService = AdenaService.getInstance();
    
    const checkWalletConnection = async () => {
      let connected = adenaService.isConnected();
      
      if (connected) {
        try {
          const account = await adenaService.getSdk().getAccount();
          if (!account?.data?.address) {
            adenaService.disconnectWallet();
            connected = false;
          }
        } catch {
          adenaService.disconnectWallet();
          connected = false;
        }
      }
      
      setIsConnected(connected);
      
      if (connected) {
        const address = adenaService.getAddress();
        if (address) {
          setWalletAddress(address);
        }
      }
    };
    
    const handleAddressChanged = (event: CustomEvent) => {
      const { newAddress } = event.detail;
      if (newAddress) {
        setIsConnected(true);
        setWalletAddress(newAddress);
      } else {
        setIsConnected(false);
        setWalletAddress("");
      }
    };
    
    checkWalletConnection();
    
    window.addEventListener('adenaAddressChanged', handleAddressChanged as EventListener);
    
    return () => {
      window.removeEventListener('adenaAddressChanged', handleAddressChanged as EventListener);
    };
  }, []);
  
  const handleWalletConnection = async () => {
    const adenaService = AdenaService.getInstance();
    
    if (isConnected) {
      adenaService.disconnectWallet();
      setIsConnected(false);
      setWalletAddress("");
    } else {
      try {
        await adenaService.connectWallet();
        const address = adenaService.getAddress();
        if (address) {
          setWalletAddress(address);
        }
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    }
  };

  return (
    <div className="flex justify-between items-center py-2 pl-40 pr-36">
      {/* Left section with logo and menu */}
      <div className="flex items-center">
        {/* Logo */}
        <div className="mr-6 text-gray-200">Logo</div>
        
        {/* Navigation Menu */}
        <NavigationMenu>
          <NavigationMenuList className="bg-customGray-800/70 rounded-full">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <NavigationMenuItem key={index} className="text-gray-400">
                  <NavigationMenuLink
                    href={item.href}
                    className={`block rounded-full text-gray-200 ${
                      isActive ? 'bg-customGray-700/60 text-gray-200 hover:bg-customGray-700/60 hover:text-gray-200' : 'hover:bg-customGray-700 hover:text-gray-200'
                    }`}
                  >
                    {item.name}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      
      {/* Right-aligned wallet button */}
      <div className="flex justify-end items-center">
        <Button 
          variant="ghost" 
          className={cn(
            "bg-customGray-800 text-gray-200 rounded-full",
            isConnected 
              ? "mr-2"
              : "mr-5 hover:bg-customGray-700 hover:text-gray-200"
          )}
          onClick={isConnected ? undefined : handleWalletConnection}
        >
          <WalletIcon className="w-4 h-4 mr-2" />
          {isConnected ? formatAddress(walletAddress) : "Connect Wallet"}
        </Button>
        
        {isConnected && (
          <Button
            variant="ghost"
            size="icon"
            className="bg-transparent text-gray-200 rounded-full hover:bg-customGray-700 hover:text-red-600 mr-5"
            onClick={handleWalletConnection}
            title="Disconnect wallet"
          >
            <LogOutIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
} 
