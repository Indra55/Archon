'use client'

import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface StalenessAlertProps {
  message: string
  serviceName: string
  severity: 'high' | 'medium'
  triggeredAt: string
  onAction?: () => void
}

export function StalenessAlert({
  message,
  serviceName,
  severity,
  triggeredAt,
  onAction,
}: StalenessAlertProps) {
  const isHigh = severity === 'high'

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border px-3 py-2.5 flex items-start gap-3 ${
        isHigh
          ? 'bg-amber/10 border-amber/40'
          : 'bg-elevated/50 border-dim'
      }`}
    >
      <AlertTriangle
        className={`shrink-0 mt-0.5 ${isHigh ? 'text-amber' : 'text-muted'}`}
        size={16}
      />
      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs text-primary">{message}</p>
        <p className="font-mono text-[10px] text-muted mt-0.5">
          {serviceName} · {triggeredAt}
        </p>
      </div>
      {onAction && (
        <button
          onClick={onAction}
          className="shrink-0 font-mono text-[11px] text-accent hover:underline"
        >
          Fix →
        </button>
      )}
    </motion.div>
  )
}
