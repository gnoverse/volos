import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"

export default function BorrowLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex justify-center items-center h-[91vh] mx-8 my-2">
      <Card className="w-full h-full bg-gray-600/70 border-none shadow-lg overflow-y-auto hide-scrollbar px-64">
        <CardHeader className="">
          <Card className="w-full h-[120px] bg-gray-800/70 border-none shadow-inner">
            {/* Content for the header card goes here */}
          </Card>
        </CardHeader>
        <CardContent className="">
          {children}
        </CardContent>
      </Card>
    </div>
  )
} 
