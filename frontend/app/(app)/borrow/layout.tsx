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
    <div className="h-full w-full px-6">
      <Card className="w-full max-h-[91vh] bg-gray-800/80 border-none overflow-y-auto hide-scrollbar ">
        <CardContent className="p-6 justify-center">
          {children}
        </CardContent>
      </Card>
    </div>
  )
} 
