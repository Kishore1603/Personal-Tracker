'use client'

import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-green-400" />,
  error: <XCircle className="h-5 w-5 text-red-400" />,
  warning: <AlertCircle className="h-5 w-5 text-yellow-400" />,
  info: <Info className="h-5 w-5 text-blue-400" />,
}

const borderColors = {
  success: 'border-green-500/30',
  error: 'border-red-500/30',
  warning: 'border-yellow-500/30',
  info: 'border-blue-500/30',
}

interface ToastItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

function ToastItem({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  return (
    <motion.div
      key={toast.id}
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      className={cn(
        'flex items-start gap-3 rounded-xl border bg-gray-50/95 backdrop-blur-xl p-4 shadow-xl w-80',
        borderColors[toast.type]
      )}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-xs text-gray-500">{toast.message}</p>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

export function ToastProvider() {
  const { toasts, registerCallback } = useToast()
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    const cleanup = registerCallback()
    return cleanup
  }, [registerCallback])

  useEffect(() => {
    setItems(toasts)
  }, [toasts])

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {items.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={(id) => setItems((prev) => prev.filter((t) => t.id !== id))}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
