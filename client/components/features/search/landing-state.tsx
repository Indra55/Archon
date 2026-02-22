import { Search, Clock, Bookmark } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Question {
  query: string
  tag: string
}

interface SearchLandingProps {
  onSearch: (query: string) => void
}

const RECENT_SEARCHES = [
  { query: 'Where is rate limiting handled and how does it work?', time: '2hr ago' },
  { query: 'Which services communicate with the Payment Service?', time: '5hr ago' },
  { query: 'How are JWT tokens validated across services?', time: '1d ago' },
  { query: 'What happens when the Order Service fails?', time: '2d ago' },
]

export function SearchLanding({ onSearch }: SearchLandingProps) {
  const [dynamicQuestions, setDynamicQuestions] = useState<Question[]>([])

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/v1/knowledge/questions`)
        const data = await response.json()
        if (Array.isArray(data)) {
          setDynamicQuestions(data)
        }
      } catch (err) {
        console.error("Failed to fetch sample questions:", err)
      }
    }
    fetchQuestions()
  }, [])

  const handleSearch = (query: string) => {
    onSearch(query)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-4">
      <div className="w-full max-w-[720px] space-y-12">
        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const input = e.currentTarget.querySelector('input') as HTMLInputElement
            if (input && input.value.trim()) {
              handleSearch(input.value)
            }
          }}
          className="mt-[20vh]"
        >
          <div className="relative">
            <Search className="absolute left-4 top-4 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Ask anything about your codebase..."
              className="w-full px-4 py-3 pl-12 pr-12 bg-card border border-muted-foreground/40 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent/15 transition-all duration-150 font-mono text-sm"
              autoFocus
            />
            <div className="absolute right-3 top-3.5 bg-card/80 backdrop-blur rounded px-2 py-0.5 font-mono text-xs text-muted-foreground border border-muted-foreground/20">
              ⌘K
            </div>
          </div>
        </form>

      {/* Recent Section */}
        <div className="space-y-3">
          <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Recent
          </h3>
          <div className="space-y-0.5">
            {RECENT_SEARCHES.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(item.query)}
                className="w-full flex items-center gap-3 py-2.5 px-0 border-b border-muted-foreground/20 hover:border-accent/60 transition-colors group"
              >
                <Clock size={14} className="text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground font-mono flex-1 text-left group-hover:text-accent transition-colors">
                  {item.query}
                </span>
                <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                  {item.time}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Questions Section */}
        <div className="space-y-3">
          <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Suggested Questions
          </h3>
          <div className="space-y-0.5">
            {dynamicQuestions.length > 0 ? (
              dynamicQuestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(item.query)}
                  className="w-full flex items-start gap-3 py-2.5 px-0 border-b border-muted-foreground/20 hover:border-accent/60 transition-colors group"
                >
                  <Bookmark size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 text-left">
                    <div className="text-sm text-foreground font-mono group-hover:text-accent transition-colors">
                      {item.query}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      tag: {item.tag}
                    </div>
                  </div>
                </button>
              ))
            ) : (
                <div className="text-xs text-muted-foreground font-mono py-4">Loading suggestions...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
