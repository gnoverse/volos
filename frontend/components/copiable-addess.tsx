"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface CopiableAddressProps {
	value: string | null | undefined
	short?: boolean
	className?: string
}

export function CopiableAddress({ value, short = true, className }: CopiableAddressProps) {
	const [copied, setCopied] = useState(false)

	useEffect(() => {
		if (!copied) return
		const t = setTimeout(() => setCopied(false), 1200)
		return () => clearTimeout(t)
	}, [copied])

	const display = (() => {
		if (!value) return "-"
		if (!short) return value
		const start = value.slice(0, 6)
		const end = value.slice(-6)
		return `${start}...${end}`
	})()

	const handleCopy = async () => {
		if (!value) return
		try {
			await navigator.clipboard.writeText(value)
			setCopied(true)
		} catch {
			// noop
		}
	}

	return (
		<span
			onClick={handleCopy}
			title={value || ""}
			className={cn(
				"text-left truncate cursor-pointer transition-colors text-white hover:text-logo-400",
				copied && "text-green-500",
				className,
			)}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") handleCopy()
			}}
		>
			{copied ? "Copied!" : display}
		</span>
	)
}

export default CopiableAddress


