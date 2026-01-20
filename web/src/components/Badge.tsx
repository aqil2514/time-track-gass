import React from 'react'
import { cn } from '../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'outline' | 'coding' | 'meeting' | 'browsing' | 'communication' | 'design' | 'other'
  className?: string
}

const categoryColors: Record<string, string> = {
  default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
  secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'text-foreground',
  coding: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  meeting: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  browsing: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  communication: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  design: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  other: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
  const baseStyles = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'

  const style = categoryColors[variant] || categoryColors.default

  return (
    <div className={cn(baseStyles, style, className)}>
      {children}
    </div>
  )
}

