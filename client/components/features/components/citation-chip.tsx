'use client'

import { Link2 } from 'lucide-react'

interface Citation {
  id: string
  text: string
  source: string
}

interface CitationChipProps {
  citation: Citation
}

export function CitationChip({ citation }: CitationChipProps) {
  return (
    <button
      className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 border border-accent/40 rounded text-xs text-accent hover:bg-accent/20 hover:border-accent/60 transition-all duration-300 font-mono whitespace-nowrap"
      title={citation.text}
    >
      <Link2 size={12} className="flex-shrink-0" />
      <span className="truncate max-w-xs">[{citation.source}]</span>
    </button>
  )
}
