'use client'

import { StreamingText } from '@/components/shared/StreamingText'
import { CitationChip } from '../components/citation-chip'

type Segment =
  | { type: 'text'; content: string }
  | { type: 'citation'; filename: string; line: number }

interface AnswerRendererProps {
  segments: Segment[]
  onCitationClick?: (filename: string, line: number) => void
}

export function AnswerRenderer({
  segments,
  onCitationClick,
}: AnswerRendererProps) {
  const fullText = segments
    .map(seg => (seg.type === 'text' ? seg.content : ' '))
    .join('')

  return (
    <div className="font-mono text-sm text-secondary leading-relaxed">
      <StreamingText
        text={fullText}
        speed={8}
        className="whitespace-pre-wrap"
      />

      {/* Render citations inline */}
      <div className="mt-4 flex flex-wrap gap-2">
        {segments
          .filter(seg => seg.type === 'citation')
          .map((seg, idx) => {
            if (seg.type === 'citation') {
              return (
                <button
                  key={idx}
                  onClick={() =>
                    onCitationClick?.(seg.filename, seg.line)
                  }
                  className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 border border-accent/40 rounded text-xs text-accent hover:bg-accent/20 hover:border-accent/60 transition-all duration-300 font-mono whitespace-nowrap"
                >
                  📄 {seg.filename.split('/').pop()}:{seg.line}
                </button>
              )
            }
          })}
      </div>
    </div>
  )
}
