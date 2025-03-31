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
    <div className="flex justify-center items-center h-[91vh] mx-6 my-2">
      <Card className="w-full h-full bg-gray-600/70 border-none shadow-lg overflow-y-auto hide-scrollbar px-48">
        <CardContent className="">
          {children}
        </CardContent>
      </Card>
    </div>
  )
} 
