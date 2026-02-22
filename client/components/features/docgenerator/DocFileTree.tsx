'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { FileText, ChevronRight } from 'lucide-react'
import type { DocFile } from '@/data/docGeneratorMockData'
import { DocStatusBadge } from './DocStatusBadge'

interface DocFileTreeProps {
  files: DocFile[]
  selectedFileId: string | null
  onSelectFile: (file: DocFile) => void
}

export function DocFileTree({
  files,
  selectedFileId,
  onSelectFile,
}: DocFileTreeProps) {
  return (
    <div className="py-2">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted px-3 mb-2">
        Doc files
      </p>
      <AnimatePresence mode="popLayout">
        {files.map((file, idx) => {
          const isSelected = file.id === selectedFileId
          const pendingCount = file.hunks.filter((h) => h.status === 'pending').length

          return (
            <motion.button
              key={file.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => onSelectFile(file)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg transition-colors ${
                isSelected
                  ? 'bg-elevated border border-focus/50'
                  : 'border border-transparent hover:bg-elevated/60'
              }`}
            >
              <FileText className="w-4 h-4 text-muted shrink-0" />
              <span className="flex-1 font-mono text-xs text-primary truncate">
                {file.label}
              </span>
              {pendingCount > 0 && (
                <span className="font-mono text-[10px] text-amber bg-amber/15 px-1.5 py-0.5 rounded">
                  {pendingCount}
                </span>
              )}
              <ChevronRight
                className={`w-4 h-4 text-muted shrink-0 transition-transform ${
                  isSelected ? 'rotate-90' : ''
                }`}
              />
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
