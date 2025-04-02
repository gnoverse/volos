import {
  Card,
  CardContent,
} from "@/components/ui/card"

export default function BorrowLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <Card className="absolute w-full h-full bg-black/50 border-none overflow-y-auto hide-scrollbar m-2">
        <CardContent className="">
          {children}
        </CardContent>
      </Card>
  )
} 
