'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, X } from 'lucide-react'
import type { DocHunk } from '@/data/docGeneratorMockData'

interface HunkReviewerProps {
  hunks: DocHunk[]
  fileId: string
  onAcceptHunk: (fileId: string, hunkId: string) => void
  onRejectHunk: (fileId: string, hunkId: string) => void
  onAcceptAll: (fileId: string) => void
  onRejectAll: (fileId: string) => void
}

export function HunkReviewer({
  hunks,
  fileId,
  onAcceptHunk,
  onRejectHunk,
  onAcceptAll,
  onRejectAll,
}: HunkReviewerProps) {
  const pendingHunks = hunks.filter((h) => h.status === 'pending')
  if (hunks.length === 0) return null

  return (
    <div className="border-t border-dim pt-3 mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Hunks ({pendingHunks.length} pending)
        </p>
        {pendingHunks.length > 0 && (
          <div className="flex gap-1">
            <button
              onClick={() => onAcceptAll(fileId)}
              className="font-mono text-[10px] text-green hover:underline"
            >
              Accept all
            </button>
            <span className="text-muted">|</span>
            <button
              onClick={() => onRejectAll(fileId)}
              className="font-mono text-[10px] text-red hover:underline"
            >
              Reject all
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {hunks.map((hunk) => (
            <motion.div
              key={hunk.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                hunk.status === 'pending'
                  ? 'bg-elevated/50 border-dim'
                  : hunk.status === 'accepted'
                  ? 'bg-green/10 border-green/30'
                  : 'bg-red/10 border-red/30 opacity-60'
              }`}
            >
              <div>
                <span className="font-mono text-[11px] text-primary">
                  L{hunk.lineStart}–L{hunk.lineEnd}
                </span>
                {hunk.context && (
                  <p className="font-mono text-[10px] text-muted mt-0.5 truncate max-w-[140px]">
                    {hunk.context}
                  </p>
                )}
              </div>
              {hunk.status === 'pending' ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => onAcceptHunk(fileId, hunk.id)}
                    className="p-1 rounded hover:bg-green/20 text-green transition-colors"
                    aria-label="Accept"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRejectHunk(fileId, hunk.id)}
                    className="p-1 rounded hover:bg-red/20 text-red transition-colors"
                    aria-label="Reject"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span
                  className={`font-mono text-[10px] ${
                    hunk.status === 'accepted' ? 'text-green' : 'text-red'
                  }`}
                >
                  {hunk.status === 'accepted' ? 'Accepted' : 'Rejected'}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
