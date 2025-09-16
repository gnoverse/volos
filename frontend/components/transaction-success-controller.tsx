"use client"

import { useEffect, useSyncExternalStore } from "react"
import { TransactionSuccessDialog } from "./transaction-success-dialog"

type TxSuccessState = {
  isOpen: boolean
  title: string
}

class TxSuccessStore {
  private state: TxSuccessState = { isOpen: false, title: "" }
  private listeners = new Set<() => void>()

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.state

  open = (payload: { title: string }) => {
    this.state = { isOpen: true, title: payload.title }
    this.emit()
  }

  close = () => {
    this.state = { ...this.state, isOpen: false }
    this.emit()
  }

  private emit() {
    this.listeners.forEach((l) => l())
  }
}

export const txSuccessStore = new TxSuccessStore()

export function openTxSuccess(payload: { title: string }) {
  txSuccessStore.open(payload)
}

export function closeTxSuccess() {
  txSuccessStore.close()
}

export function TransactionSuccessPortal() {
  const state = useSyncExternalStore(txSuccessStore.subscribe, txSuccessStore.getSnapshot, txSuccessStore.getSnapshot)

  // auto-close timer same as component behavior
  useEffect(() => {
    if (state.isOpen) {
      const t = setTimeout(() => txSuccessStore.close(), 2000)
      return () => clearTimeout(t)
    }
  }, [state.isOpen])

  return (
    <TransactionSuccessDialog
      isOpen={state.isOpen}
      onClose={() => txSuccessStore.close()}
      title={state.title}
    />
  )
}


