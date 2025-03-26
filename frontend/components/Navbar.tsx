import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList
} from "@/components/ui/navigation-menu"

const menuItems = [
  { name: "Borrow", href: "/borrow" },
  { name: "Explore", href: "/explore" },
]


export default function Navbar() {
  return (
    <NavigationMenu className="mx-1 p-3 bg-gray-800 rounded-b-full shadow-lg">
      <NavigationMenuList className="bg-gray-600/50 rounded-full">
        {menuItems.map((item, index) => (
          <NavigationMenuItem key={index} className="text-gray-400">
            <NavigationMenuLink href={item.href} className="block hover:bg-gray-800/60 hover:text-gray-400 rounded-full">
              {item.name}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
} 
