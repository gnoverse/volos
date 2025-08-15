import { cn } from "@/lib/utils"
import * as React from "react"

export interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  pressed?: boolean
  onPressedChange?: (pressed: boolean) => void
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed = false, onPressedChange, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={pressed}
        data-state={pressed ? "on" : "off"}
        onClick={(e) => {
          props.onClick?.(e)
          onPressedChange?.(!pressed)
        }}
        className={cn(
          "inline-flex items-center justify-center rounded-md border border-gray-600 bg-transparent px-3 py-2 text-sm font-medium text-gray-300 transition-colors",
          "hover:bg-gray-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
          "data-[state=on]:bg-orange-500 data-[state=on]:text-white",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Toggle.displayName = "Toggle"


