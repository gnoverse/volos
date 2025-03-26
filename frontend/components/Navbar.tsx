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
    const checkWalletConnection = async () => {
      const adenaService = AdenaService.getInstance();
      const connected = adenaService.isConnected();
      setIsConnected(connected);
      
      if (connected) {
        const address = adenaService.getAddress();
        if (address) {
          setWalletAddress(address);
        }
      }
    };
    
    checkWalletConnection();
  }, []);
  
  const handleWalletConnection = async () => {
    const adenaService = await AdenaService.getInstance();
    
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
    <div className="flex justify-between items-center mx-1 p-2 bg-gray-800 rounded-b-full shadow-lg">
      {/* Logo or left section (empty for now) */}
      <div className="w-1/4">Logo section</div>
      
      {/* Centered menu */}
      <div className="flex justify-center w-1/2">
        <NavigationMenu className="mx-auto">
          <NavigationMenuList className="bg-gray-600/50 rounded-full">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <NavigationMenuItem key={index} className="text-gray-400">
                  <NavigationMenuLink
                    href={item.href}
                    className={`block rounded-full ${
                      isActive ? 'bg-gray-800/60 text-gray-400 hover:bg-gray-800/60 hover:text-gray-400' : 'hover:bg-gray-600 hover:text-gray-200'
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
      <div className="w-1/4 flex justify-end items-center">
        <Button 
          variant="ghost" 
          className={cn(
            "bg-gray-700 text-gray-400  rounded-full",
            isConnected 
              ? "mr-2 hover:bg-gray-700 hover:text-gray-400"
              : "mr-5 hover:bg-gray-600 hover:text-gray-200"
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
            className="bg-transparent text-gray-400 rounded-full hover:bg-gray-700 hover:text-red-600 mr-5"
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
