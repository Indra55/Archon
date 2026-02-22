'use client'

import { motion } from 'framer-motion'
import { Check, AlertTriangle, Clock, FileEdit } from 'lucide-react'
import type { DocStatus } from '@/data/docGeneratorMockData'

interface DocStatusBadgeProps {
  status: DocStatus
  size?: 'sm' | 'md'
}

const statusConfig: Record<
  DocStatus,
  { label: string; icon: typeof Check; className: string }
> = {
  current: {
    label: 'Current',
    icon: Check,
    className: 'bg-green/15 text-green border-green/30',
  },
  stale: {
    label: 'Stale',
    icon: AlertTriangle,
    className: 'bg-amber/15 text-amber border-amber/30',
  },
  generating: {
    label: 'Generating',
    icon: Clock,
    className: 'bg-accent/15 text-accent border-accent/30',
  },
  needs_review: {
    label: 'Needs review',
    icon: FileEdit,
    className: 'bg-amber/15 text-amber border-amber/30',
  },
}

export function DocStatusBadge({ status, size = 'md' }: DocStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-medium ${config.className} ${
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1'
      }`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {config.label}
    </motion.span>
  )
}
