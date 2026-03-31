'use client'

import { Bell, LogOut, User, Settings } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProgressBar } from '@/components/ui/badge'
import { LEVELS } from '@/lib/gamification'

interface HeaderProps {
  title: string
  subtitle?: string
  unreadCount?: number
  levelData?: {
    level: number
    name: string
    badge: string
    progressPercent: number
    color: string
  } | null
}

export function Header({ title, subtitle, unreadCount = 0, levelData }: HeaderProps) {
  const { data: session } = useSession()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white/80 px-6 py-4 backdrop-blur-sm">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Level indicator */}
        {levelData && (
          <div className="hidden lg:flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2">
            <span className="text-lg">{levelData.badge}</span>
            <div>
              <p className="text-xs text-gray-500">
                Lv.{levelData.level} <span style={{ color: levelData.color }}>{levelData.name}</span>
              </p>
              <ProgressBar value={levelData.progressPercent} max={100} color={levelData.color} size="sm" />
            </div>
          </div>
        )}

        {/* Notification bell */}
        <Link href="/notifications">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-gray-900"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </motion.div>
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 hover:bg-gray-100 transition-colors"
          >
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || ''}
                width={28}
                height={28}
                className="rounded-full"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-900" />
              </div>
            )}
            <span className="hidden sm:block text-sm text-gray-700 max-w-[120px] truncate">
              {session?.user?.name?.split(' ')[0] || 'User'}
            </span>
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-gray-200 bg-gray-50 shadow-2xl overflow-hidden"
                >
                  <div className="p-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => signOut({ callbackUrl: '/signin' })}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
