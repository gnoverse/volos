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
    <div className="h-full w-full px-48">
      <Card className="w-full h-[91vh] bg-gray-800/80 border-none overflow-y-auto hide-scrollbar rounded-3xl">
        <CardContent className="px-6 justify-center">
          {children}
        </CardContent>
      </Card>
    </div>
  )
} 
