import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      autoComplete="off"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-transparent dark:bg-transparent flex h-9 w-full min-w-0 rounded-md bg-transparent text-base transition-colors outline-none border px-3 py-2 file:inline-flex file:h-7 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
        "[&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-inherit [&:-webkit-autofill]:shadow-[0_0_0_1000px_transparent_inset] [&:-webkit-autofill:focus]:bg-transparent [&:-webkit-autofill:hover]:bg-transparent [&:-webkit-autofill:active]:bg-transparent",
        "[-webkit-background-clip:text] [background-clip:text]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
