'use client'

import { useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

let toastCallbacks: ((toast: Toast) => void)[] = []

export function addToast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  const fullToast = { ...toast, id }
  toastCallbacks.forEach((cb) => cb(fullToast))
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const registerCallback = useCallback(() => {
    const cb = (toast: Toast) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 4000)
    }
    toastCallbacks.push(cb)
    return () => {
      toastCallbacks = toastCallbacks.filter((c) => c !== cb)
    }
  }, [])

  const toast = {
    success: (title: string, message?: string) => addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) => addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) => addToast({ type: 'info', title, message }),
  }

  return { toasts, registerCallback, toast }
}
