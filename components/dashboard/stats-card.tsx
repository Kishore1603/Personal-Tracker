'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: string
  trend?: { value: number; label: string }
  delay?: number
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = '#059669',
  trend,
  delay = 0,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-gray-200 bg-gray-50 p-5 backdrop-blur-xl relative overflow-hidden"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-5 rounded-2xl"
        style={{ background: `radial-gradient(circle at 0% 0%, ${color}, transparent 70%)` }}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{title}</p>
            <motion.p
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.1, type: 'spring' }}
              className="mt-1 text-3xl font-bold text-gray-900"
            >
              {value}
            </motion.p>
            {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>

        {trend && (
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={cn(
                'text-xs font-medium',
                trend.value >= 0 ? 'text-green-400' : 'text-red-400'
              )}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-xs text-gray-500">{trend.label}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
