'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, RefreshCw, Save } from 'lucide-react'

interface TopControlBarProps {
  view: 'landing' | 'browsing' | 'editing'
  title: string
  subtitle?: string
  onBack: () => void
  onRegenerate?: () => void
  onSave?: () => void
  isGenerating?: boolean
}

export function TopControlBar({
  view,
  title,
  subtitle,
  onBack,
  onRegenerate,
  onSave,
  isGenerating = false,
}: TopControlBarProps) {
  const showBack = view !== 'landing'

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-4 py-3 border-b border-dim bg-surface/80 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-elevated border border-dim hover:border-focus transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-secondary" />
          </button>
        )}
        <div>
          <h1 className="font-sans text-base font-semibold text-primary">{title}</h1>
          {subtitle && (
            <p className="font-mono text-[11px] text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onRegenerate && view === 'editing' && (
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs border border-dim hover:bg-elevated hover:border-focus transition-all disabled:opacity-50 disabled:cursor-not-allowed text-secondary"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`}
            />
            Regenerate
          </button>
        )}
        {onSave && view === 'editing' && (
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs bg-accent text-primary font-medium hover:opacity-90 transition-opacity"
          >
            <Save className="w-3.5 h-3.5" />
            Save changes
          </button>
        )}
      </div>
    </motion.div>
  )
}
