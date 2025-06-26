"use client"

import { AdenaService } from "@/app/services/adena.service";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList
} from "@/components/ui/navigation-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LogOutIcon, WalletIcon } from "lucide-react";
import { usePathname } from 'next/navigation';
import { useEffect, useState } from "react";
import Logo from "./logo";

const menuItems = [
  { name: "Borrow", href: "/borrow" },
  { name: "Explore", href: "/explore" },
]

export default function Navbar() {
  const pathname = usePathname();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [copied, setCopied] = useState(false);
  
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

  // todo: replace this with a toast
  const handleCopyAddress = async () => {
    if (isConnected && walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  return (
    <div className="flex justify-between items-center py-2 pl-40 pr-36">
      {/* Left section with logo and menu */}
      <div className="flex items-center">
        {/* Logo */}
          <Logo />
        
        {/* Navigation Menu */}
        <NavigationMenu>
          <NavigationMenuList className="bg-customGray-800/70 rounded-full px-1 py-1">
            {menuItems.map((item, index) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <NavigationMenuItem key={index} className="text-gray-400">
                  <NavigationMenuLink
                    href={item.href}
                    className={`block rounded-full px-4 py-2 text-gray-200 text-lg ${
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
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "bg-customGray-800 text-gray-200 rounded-full text-lg",
                  isConnected 
                    ? "mr-2 hover:bg-customGray-800 hover:text-gray-200"
                    : "mr-5 hover:bg-customGray-700 hover:text-gray-200"
                )}
                onClick={isConnected ? handleCopyAddress : handleWalletConnection}
              >
                <WalletIcon className="w-4 h-4 mr-2" />
                {isConnected ? (copied ? "Copied!" : formatAddress(walletAddress)) : "Connect Wallet"}
              </Button>
            </TooltipTrigger>
            {isConnected && (
              <TooltipContent>
                <p>{walletAddress}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        
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
