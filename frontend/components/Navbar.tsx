"use client"

import CopiableAddress from "@/components/copiable-addess";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList
} from "@/components/ui/navigation-menu";
import { useUserAddress } from "@/hooks/use-user-address";
import { cn } from "@/lib/utils";
import { LogOutIcon, WalletIcon } from "lucide-react";
import { usePathname } from 'next/navigation';
import Logo from "./logo";

const menuItems = [
  { name: "Markets", href: "/borrow" },
  { name: "Governance", href: "/governance" },
  { name: "Docs", href: "/documentation" },
  { name: "About Us", href: "/about-us" },
]

export default function Navbar() {
  const pathname = usePathname();
  const { userAddress: walletAddress, isConnected, handleWalletConnection } = useUserAddress({ validateConnection: true });

  return (
    <div className="flex justify-between items-center py-2 pl-40 pr-36">
      {/* Left section with logo and menu */}
      <div className="flex items-center">
        {/* Logo */}
          <Logo />
          <span className="text-[48px] mr-4 text-gray-200">
            Volos
          </span>
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
                      isActive ? 'bg-customGray-700/60 text-logo-500 hover:bg-customGray-700/60 hover:text-logo-500' : 'hover:bg-customGray-700 hover:text-gray-400'
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
            "bg-customGray-800 text-gray-400 rounded-full text-lg",
            isConnected 
              ? "mr-2 hover:bg-customGray-800 hover:text-logo-500"
              : "mr-5 hover:bg-customGray-800 hover:text-logo-500"
          )}
          onClick={isConnected ? undefined : handleWalletConnection}
          title={isConnected ? undefined : "Connect Wallet"}
        >
          <WalletIcon className="w-4 h-4 mr-2" />
          {isConnected ? (
            <CopiableAddress value={walletAddress} short className="text-gray-200" />
          ) : (
            "Connect Wallet"
          )}
        </Button>
        
        {isConnected && (
          <Button
            variant="ghost"
            size="icon"
            className="bg-transparent text-gray-300 rounded-full hover:bg-customGray-700 hover:text-red-600 mr-5"
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
