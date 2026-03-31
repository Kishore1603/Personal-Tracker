'use client'

import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Target,
  Trophy,
  Wallet,
  Film,
  Map,
  Gift,
  BarChart3,
  Bell,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Daily Goals', href: '/goals', icon: Target },
  { label: 'Resolutions', href: '/resolutions', icon: Trophy },
  { label: 'Finance', href: '/finance', icon: Wallet },
  { label: 'Movies', href: '/movies', icon: Film },
  { label: 'Trips', href: '/trips', icon: Map },
  { label: 'Rewards', href: '/rewards', icon: Gift },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Notifications', href: '/notifications', icon: Bell },
]

export function Sidebar({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex h-screen flex-col border-r border-gray-200 bg-white/90 backdrop-blur-xl py-6 shrink-0"
    >
      {/* Logo */}
      <div className={cn('flex items-center px-4 mb-8', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 shrink-0">
          <Zap className="h-5 w-5 text-gray-900" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-bold text-gray-900 text-base leading-tight">Life Tracker</p>
              <p className="text-[10px] text-emerald-600/70 uppercase tracking-widest">Pro</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-700 border border-emerald-500/20'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
                  collapsed && 'justify-center px-2'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-emerald-600"
                  />
                )}
                <Icon className="h-5 w-5 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.label === 'Notifications' && unreadCount > 0 && !collapsed && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-gray-900">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {item.label === 'Notifications' && unreadCount > 0 && collapsed && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-auto mt-4 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </motion.aside>
  )
}
