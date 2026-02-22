'use client'

import { useState, useMemo } from 'react'
import { SourceCard } from '@/components/features/components/source-card'
import { StreamingText } from '@/components/shared/StreamingText'
import { Loader, Bookmark, Share2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface SearchResult {
  answer: string
  segments: Array<
    | { type: 'text'; content: string }
    | { type: 'citation'; filename: string; line: number }
  >
  sources: Array<{
    id: string
    filename: string
    lineRange: string
    snippet: string
  }>
}

interface SearchResultsProps {
  results: SearchResult
  isLoading: boolean
  onSearch: (query: string) => void
}

export function SearchResults({ results, isLoading, onSearch }: SearchResultsProps) {
  const [followUpQuery, setFollowUpQuery] = useState('')
  const [activeCitation, setActiveCitation] = useState<{
    filename: string
    line: number
  } | null>(null)

  // Find active source card
  const activeSource = useMemo(() => {
    if (!activeCitation) return null
    return results.sources.find(s => s.filename === activeCitation.filename)
  }, [activeCitation, results.sources])

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Answer Zone - Flex 70% */}
          <div className="flex-[7] space-y-6 min-w-0">
            {/* Answer Text */}
            <div className="bg-card border border-muted-foreground/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Answer
                </h2>
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader size={14} className="animate-spin" />
                    <span className="text-xs font-mono">Searching...</span>
                  </div>
                )}
              </div>

              <div className="prose prose-invert prose-sm max-w-none font-mono text-foreground leading-relaxed">
                {isLoading && !results.answer ? (
                   <div className="space-y-4 animate-pulse">
                     <div className="h-4 bg-muted rounded w-3/4"></div>
                     <div className="h-4 bg-muted rounded w-1/2"></div>
                     <div className="h-4 bg-muted rounded w-5/6"></div>
                   </div>
                ) : (
                  <ReactMarkdown>
                    {results.answer}
                  </ReactMarkdown>
                )}
              </div>

              {/* Inline Citations - Rounded Squares */}
              {results.segments.length > 0 && !isLoading && (
                <div className="mt-6 pt-4 border-t border-muted-foreground/10">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-3">
                    Sources
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {results.segments
                      .filter(seg => seg.type === 'citation')
                      .map((seg, idx) => {
                        if (seg.type === 'citation') {
                          return (
                            <button
                              key={idx}
                              title={`${seg.filename}:${seg.line}`}
                              onClick={() =>
                                setActiveCitation({
                                  filename: seg.filename,
                                  line: seg.line,
                                })
                              }
                              className="inline-flex items-center justify-center w-8 h-8 bg-accent/10 border border-accent/40 rounded-lg text-[10px] text-accent hover:bg-accent/20 hover:border-accent/60 transition-all duration-300 font-mono"
                            >
                              {idx + 1}
                            </button>
                          )
                        }
                      })}
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-muted-foreground/20 flex gap-4">
                <button className="flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-accent transition-colors">
                  <Bookmark size={14} />
                  Add to Knowledge Base
                </button>
                <button className="flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-accent transition-colors">
                  <Share2 size={14} />
                  Share Answer
                </button>
              </div>
            </div>

            {/* Follow-up Input */}
            <form 
              className="space-y-3" 
              onSubmit={(e) => {
                e.preventDefault();
                if (followUpQuery.trim() && !isLoading) {
                  onSearch(followUpQuery);
                  setFollowUpQuery('');
                }
              }}
            >
              <input
                type="text"
                value={followUpQuery}
                onChange={(e) => setFollowUpQuery(e.target.value)}
                placeholder="Ask a follow-up about this answer..."
                className="w-full px-4 py-3 bg-card border border-muted-foreground/40 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-300 font-mono text-sm"
              />
            </form>
          </div>

          {/* Sources Panel - Flex 30% */}
          <div className="flex-[3] min-w-0">
            <div className="sticky top-40">
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
                {results.sources.length} Sources Referenced
              </h3>
              <div className="space-y-3">
                {results.sources.map((source, idx) => (
                  <div
                    key={source.id}
                    className={`transition-all duration-300 ${
                      activeSource?.id === source.id
                        ? 'ring-2 ring-accent/50'
                        : ''
                    }`}
                  >
                    <SourceCard source={source} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
