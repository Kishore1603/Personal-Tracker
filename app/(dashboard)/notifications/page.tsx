'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, Target, Zap, Trophy, TrendingUp, AlertTriangle, Calendar, Trash2, CheckCheck } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { addToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string; type: string; title: string; message: string; read: boolean; createdAt: string
}

const TYPE_ICONS: Record<string, any> = {
  MISSED_GOAL: Target, STREAK_MILESTONE: Zap, REWARD_UNLOCKED: Trophy,
  LEVEL_UP: TrendingUp, OVERSPENDING: AlertTriangle, RESOLUTION_DEADLINE: Calendar,
}
const TYPE_COLORS: Record<string, string> = {
  MISSED_GOAL: '#ef4444', STREAK_MILESTONE: '#f59e0b', REWARD_UNLOCKED: '#10b981',
  LEVEL_UP: '#fbbf24', OVERSPENDING: '#f97316', RESOLUTION_DEADLINE: '#8b5cf6',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL')

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) { const { data } = await res.json(); setNotifications(data) }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markAllRead = async () => {
    const res = await fetch('/api/notifications', { method: 'PATCH' })
    if (res.ok) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      addToast({ type: 'success', title: 'All notifications marked as read' })
    }
  }

  const markRead = async (id: string) => {
    const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    if (res.ok) setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const deleteNotification = async (id: string) => {
    const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    if (res.ok) setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const displayed = filter === 'UNREAD' ? notifications.filter(n => !n.read) : notifications
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="flex flex-col h-full">
      <Header title="Notifications" subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'} />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
            {(['ALL', 'UNREAD'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${filter === f ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-900'}`}>
                {f} {f === 'UNREAD' && unreadCount > 0 && <span className="ml-1 text-xs">({unreadCount})</span>}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="ghost" icon={<CheckCheck className="h-4 w-4" />} onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-500">
            <BellOff className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">{filter === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {displayed.map((n, i) => {
                const Icon = TYPE_ICONS[n.type] || Bell
                const color = TYPE_COLORS[n.type] || '#6b7280'
                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => !n.read && markRead(n.id)}
                    className={`flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-all
                      ${n.read
                        ? 'border-gray-100 bg-gray-50 opacity-70 hover:opacity-90'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                      style={{ backgroundColor: `${color}20` }}>
                      <Icon className="h-5 w-5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${n.read ? 'text-gray-500' : 'text-gray-900'}`}>{n.title}</p>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
