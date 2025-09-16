"use client"

import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import { toast } from "sonner"

export function toastError(title: string, description?: string, duration: number = 2500) {
  toast.custom(() => (
    <div className="bg-customGray-800 rounded-2xl shadow-lg px-4 py-3 border border-logo-600">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <div className="min-w-0">
          <div className="text-red-500 font-medium">{title}</div>
          {description && <div className="text-gray-400 text-sm">{description}</div>}
        </div>
      </div>
    </div>
  ), { duration })
}

export function toastSuccess(title: string, description?: string, duration: number = 2500) {
  toast.custom(() => (
    <div className="bg-customGray-800 rounded-2xl shadow-lg px-4 py-3 border border-logo-600">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        </div>
        <div className="min-w-0">
          <div className="text-green-500 font-medium">{title}</div>
          {description && <div className="text-gray-400 text-sm">{description}</div>}
        </div>
      </div>
    </div>
  ), { duration })
}

export function toastInfo(title: string, description?: string, duration: number = 2500) {
    toast.custom(() => (
      <div className="bg-customGray-800 rounded-2xl shadow-lg px-4 py-3 border border-logo-600">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center">
            <Info className="w-6 h-6 text-logo-700" />
          </div>
          <div className="min-w-0">
            <div className="text-logo-600 font-medium">{title}</div>
            {description && <div className="text-gray-400 text-sm">{description}</div>}
          </div>
        </div>
      </div>
    ), { duration })
  }
  


