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
      <Card className="w-full max-h-[91vh] bg-gray-700 border-1 border-gray-700 overflow-y-auto hide-scrollbar ">
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>
    </div>
  )
} 
