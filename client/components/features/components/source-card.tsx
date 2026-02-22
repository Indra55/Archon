'use client'

import { ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface Source {
  id: string
  filename: string
  lineRange: string
  snippet: string
}

interface SourceCardProps {
  source: Source
}

export function SourceCard({ source }: SourceCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(source.snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-card border border-muted-foreground/30 rounded-lg p-4 hover:border-accent/60 transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          <div className="font-mono text-sm font-medium text-foreground">
            {source.filename}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            {source.lineRange}
          </div>
        </div>
      </div>

      {/* Code Block */}
      <div className="bg-[#0D0D14] rounded p-3 mb-3">
        <pre className="text-xs text-green-500 font-mono leading-relaxed overflow-x-auto">
          <code>{source.snippet}</code>
        </pre>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center gap-3 pt-3 border-t border-muted-foreground/20">
        <button className="flex items-center gap-1.5 font-mono text-xs text-accent hover:text-accent/80 transition-colors">
          <ExternalLink size={12} />
          Open in GitHub →
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-accent transition-colors"
        >
          {copied ? (
            <>
              <Check size={12} className="text-green-500" />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy path
            </>
          )}
        </button>
      </div>
    </div>
  )
}
