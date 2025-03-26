"use client"

import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList
} from "@/components/ui/navigation-menu";
import { usePathname } from 'next/navigation';

const menuItems = [
  { name: "Borrow", href: "/borrow" },
  { name: "Explore", href: "/explore" },
]

export default function Navbar() {
  const pathname = usePathname();

  return (
    <NavigationMenu className="mx-1 p-2 bg-gray-800 rounded-b-full shadow-lg">
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
  )
} 
