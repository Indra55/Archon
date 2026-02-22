'use client'

import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import { SearchLanding } from './search/landing-state'
import { SearchResults } from './search/search-results'

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

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Mock response generator
function generateMockSearchResponse(): SearchResult {
  return {
    answer:
      'Rate limiting in this codebase is handled at the API Gateway level using the middleware. It uses a sliding window algorithm with Redis as the backing store. The core configuration lives in limits.config.ts, where limits are defined per route and per user tier. High-priority endpoints like token refresh have separate, more permissive limits applied at the service level as a secondary layer.',
    segments: [
      { type: 'text', content: 'Rate limiting in this codebase is handled at the API Gateway level using the ' },
      {
        type: 'citation',
        filename: 'api-gateway/middleware/rateLimiter.js',
        line: 12,
      },
      { type: 'text', content: ' middleware. It uses a sliding window algorithm with Redis as the backing store. The core configuration lives in ' },
      {
        type: 'citation',
        filename: 'api-gateway/config/limits.config.ts',
        line: 34,
      },
      { type: 'text', content: ', where limits are defined per route and per user tier. High-priority endpoints like ' },
      {
        type: 'citation',
        filename: 'auth-service/routes/token.ts',
        line: 67,
      },
      {
        type: 'text',
        content:
          ' have separate, more permissive limits applied at the service level as a secondary layer.',
      },
    ],
    sources: [
      {
        id: '1',
        filename: 'api-gateway/middleware/rateLimiter.js',
        lineRange: '10–22',
        snippet: `const rateLimiter = require('express-rate-limit');\nconst RedisStore = require('rate-limit-redis');\n\nmodule.exports = rateLimit({\n  windowMs: 60 * 1000,\n  max: (req) => req.user?.tier === 'premium' ? 500 : 100,\n  store: new RedisStore({ client: redisClient })\n});`,
      },
      {
        id: '2',
        filename: 'api-gateway/config/limits.config.ts',
        lineRange: '32–45',
        snippet: `export const routeLimits: Record<string, RateLimitConfig> = {\n  '/v1/auth/*':     { max: 20,  window: '1m' },\n  '/v1/payments/*': { max: 50,  window: '1m' },\n  '/v1/orders/*':   { max: 200, window: '1m' },\n};`,
      },
      {
        id: '3',
        filename: 'auth-service/routes/token.ts',
        lineRange: '65–72',
        snippet: `router.post('/refresh', applyLimit({ max: 30, window: '5m' }), async (req, res) => {\n  const token = await refreshToken(req.body.refreshToken);\n  res.json({ token });\n});`,
      },
    ],
  }
}

interface CodebaseSearchInterfaceProps {}

export function CodebaseSearchInterface({}: CodebaseSearchInterfaceProps) {
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<ChatMessage[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = 0
    }
  }, [results])

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery)
    setIsLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/knowledge/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: searchQuery,
          history: history
        })
      })

      const data = await response.json()
      
      if (data.error) {
        console.error("Search failed:", data.error)
        setIsLoading(false)
        return
      }

      // Transform backend response to match frontend interface and deduplicate references
      const uniqueRefs = Array.from(new Set((data.references || []).map((ref: any) => ref.file_path)))
        .filter(Boolean);

      const transformedResults: SearchResult = {
        answer: data.answer,
        segments: uniqueRefs.map((fp: any) => ({
          type: 'citation',
          filename: fp,
          line: 1
        })),
        sources: (data.source_files || []).flatMap((file: any, fileIdx: number) => 
          (file.chunks || []).map((chunk: any, chunkIdx: number) => ({
            id: `${fileIdx}-${chunkIdx}`,
            filename: file.file_path,
            lineRange: chunk.name || "Code",
            snippet: chunk.code_snippet
          }))
        )
      }

      setResults(transformedResults)
      
      // Update history
      setHistory(prev => [
        ...prev,
        { role: 'user', content: searchQuery },
        { role: 'assistant', content: data.answer }
      ])

    } catch (err) {
      console.error("Search API error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isLoading) {
      handleSearch(query)
    }
  }

  if (!results) {
    return (
      <div className="h-full w-full relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
             <div className="w-full max-w-4xl px-8 space-y-6">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-8 w-8 bg-accent rounded-full animate-bounce"></div>
                  <h2 className="font-mono text-xl text-foreground">Analyzing Codebase...</h2>
                </div>
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-4/6"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </div>
             </div>
          </div>
        )}
        <SearchLanding onSearch={handleSearch} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full" ref={threadRef}>
      {/* Sticky search bar at top */}
      <div className="sticky top-20 z-40 bg-background/95 backdrop-blur-md border-b border-muted-foreground/20 p-4 md:p-6">
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setResults(null)}
              className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ←
            </button>
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your codebase..."
                className="w-full px-4 py-2 bg-card border border-muted-foreground/40 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-300 font-mono text-sm pl-10"
                disabled={isLoading}
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        <SearchResults results={results} isLoading={isLoading} onSearch={handleSearch} />
      </div>
    </div>
  )
}
