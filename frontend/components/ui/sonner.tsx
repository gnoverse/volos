"use client"

import { cn } from "@/lib/utils"
import { Toaster } from "sonner"

export function SonnerToaster() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton={false}
      theme="dark"
      toastOptions={{
        classNames: {
          toast: cn(
            "bg-customGray-800 border-none text-gray-200",
            "shadow-lg rounded-xl"
          ),
          title: "text-gray-200",
          description: "text-gray-400",
          actionButton: "bg-logo-600 hover:bg-logo-700 text-white",
          cancelButton: "hidden",
          closeButton: "hidden",
        },
      }}
    />
  )
}


