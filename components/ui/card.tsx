'use client'

import { cn } from '@/lib/utils'
import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

interface CardProps extends HTMLMotionProps<'div'> {
  glow?: boolean
  glowColor?: string
  hover?: boolean
  glass?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, glow, glowColor = 'emerald', hover = false, glass = true, ...props }, ref) => {
    const glowClasses: Record<string, string> = {
      emerald: 'shadow-emerald-500/20',
      purple: 'shadow-purple-500/20',
      green: 'shadow-green-500/20',
      orange: 'shadow-orange-500/20',
      pink: 'shadow-pink-500/20',
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={hover ? { y: -2, scale: 1.005 } : undefined}
        transition={{ duration: 0.2 }}
        className={cn(
          'rounded-2xl border',
          glass
            ? 'bg-white backdrop-blur-xl border-gray-200 shadow-sm'
            : 'bg-gray-50 border-gray-100',
          glow && `shadow-lg ${glowClasses[glowColor] || glowClasses.emerald}`,
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
Card.displayName = 'Card'

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 pb-3', className)} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 pt-3', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-gray-500 mt-1', className)} {...props}>
      {children}
    </p>
  )
}
