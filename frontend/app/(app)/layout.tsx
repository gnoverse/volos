"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
  // ✅ Create QueryClient in client component to avoid server/client boundary issues
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <main className="w-full h-full max-h-screen">
        {children}
      </main>
    </QueryClientProvider>
  )
}
