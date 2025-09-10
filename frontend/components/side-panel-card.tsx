"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LucideIcon } from "lucide-react"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl py-4"

interface SidePanelCardProps {
  // Card header
  icon: LucideIcon
  iconColor: string
  title: string
  
  // Form integration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
  fieldName: string
  
  // Button states
  buttonMessage: string
  isButtonDisabled: boolean
  isButtonPending: boolean
  
  // Actions
  onMaxClickAction: () => void
  onSubmitAction: () => void
  
  // Input display
  inputValue: string
}

export function SidePanelCard({
  icon: Icon,
  iconColor,
  title,
  register,
  fieldName,
  buttonMessage,
  isButtonDisabled,
  isButtonPending,
  onMaxClickAction: onMaxClick,
  onSubmitAction: onSubmit,
  inputValue,
}: SidePanelCardProps) {
  return (
    <Card className={CARD_STYLES}>
      <CardHeader className="px-4 -mb-4">
        <div className="flex items-center gap-2">
          <Icon size={16} className={iconColor} />
          <CardTitle className="text-gray-200 text-sm font-medium mb-0">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-1 pt-0 px-4">
        <Input
          type="number"
          {...register(fieldName, { pattern: /^[0-9]*\.?[0-9]*$/ })}
          className="text-3xl font-semibold text-gray-200 bg-transparent w-full border-none focus:outline-none p-0"
          placeholder="0.00"
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">${inputValue || "0"}</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-blue-500 font-medium px-1 py-0 h-6"
              onClick={onMaxClick}
            >
              MAX
            </Button>
          </div>
        </div>
        <Button
          type="button"
          className="w-full mt-1 bg-midnightPurple-800 hover:bg-midnightPurple-900/70 h-8 text-sm text-gray-300"
          disabled={isButtonDisabled}
          onClick={onSubmit}
        >
          {isButtonPending ? "Processing..." : buttonMessage}
        </Button>
      </CardContent>
    </Card>
  )
}
