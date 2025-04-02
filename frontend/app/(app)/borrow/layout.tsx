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
      <Card className="w-full h-full bg-black/50 border-none overflow-y-auto hide-scrollbar px-48">
        <CardContent className="">
          {children}
        </CardContent>
      </Card>
    </div>
  )
} 
