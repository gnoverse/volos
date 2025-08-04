"use client"

import { Card } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, 
        gcTime: 10 * 60 * 1000, 
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <main className="w-full h-full max-h-screen">
        <div className="h-full w-full px-36">
          <Card className="w-full h-[89vh] bg-gray-800/80 border-none overflow-y-auto hide-scrollbar rounded-3xl">
            <CardContent className="px-6 justify-center">
              {children}
            </CardContent>
          </Card>
        </div>
      </main>
    </QueryClientProvider>
  )
}
