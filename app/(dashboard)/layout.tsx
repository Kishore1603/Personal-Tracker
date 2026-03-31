'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { useEffect, useState } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/signin')
    }
  }, [status])

  useEffect(() => {
    if (!session?.user?.id) return
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications?unread=true&limit=1')
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.unreadCount ?? 0)
        }
      } catch {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 60000) // poll every minute
    return () => clearInterval(interval)
  }, [session?.user?.id])

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
          <p className="text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar unreadCount={unreadCount} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
