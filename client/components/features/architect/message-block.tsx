'use client'

import { ReactNode } from 'react'
import { FlowDiagram } from '@/components/features/components/flow-diagram'
import { DecisionCard } from '@/components/features/components/decision-card'

interface MessageBlockProps {
  content: string
  role: 'user' | 'assistant'
  components?: Array<'flow' | 'decision' | 'code'>
}

export function MessageBlock({
  content,
  role,
  components,
}: MessageBlockProps) {
  const parseContent = (text: string) => {
    const parts: ReactNode[] = []
    let lastIndex = 0

    // Split by code blocks
    const codeBlockRegex = /```(.*?)\n([\s\S]*?)```/g
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="text-sm font-mono leading-relaxed text-foreground/90">
            {text.substring(lastIndex, match.index)}
          </span>
        )
      }

      // Add code block
      parts.push(
        <pre
          key={`code-${match.index}`}
          className="bg-background/50 p-3 rounded border border-accent/20 overflow-x-auto my-2"
        >
          <code className="text-xs text-foreground/80 font-mono">
            {match[2]}
          </code>
        </pre>
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-end" className="text-sm font-mono leading-relaxed text-foreground/90">
          {text.substring(lastIndex)}
        </span>
      )
    }

    return parts.length > 0 ? parts : <span className="text-sm font-mono">{content}</span>
  }

  return (
    <div className="space-y-4">
      {/* Main content */}
      <div className="prose prose-invert max-w-none">
        {parseContent(content)}
      </div>

      {/* Component visualizations */}
      {role === 'assistant' && components && components.length > 0 && (
        <div className="space-y-4 mt-6 pt-4 border-t border-accent/20">
          {components.includes('flow') && (
            <div className="bg-background/30 rounded-lg p-4 border border-accent/20">
              <FlowDiagram />
            </div>
          )}
          {components.includes('decision') && (
            <div className="bg-background/30 rounded-lg p-4 border border-accent/20">
              <DecisionCard />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
