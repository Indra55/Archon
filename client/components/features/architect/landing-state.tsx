'use client'

import { useState } from 'react'

interface LandingStateProps {
  suggestions: string[]
  onSuggestionClick: (suggestion: string) => void
}

export function LandingState({
  suggestions,
  onSuggestionClick,
}: LandingStateProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      setIsLoading(true)
      onSuggestionClick(input)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setIsLoading(true)
    onSuggestionClick(suggestion)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-4">
      <div className="text-center w-full max-w-[680px] space-y-6">
        {/* Heading */}
        <h1 className="text-5xl font-bold text-foreground font-sans">
          Describe what you want to build.
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground font-mono">
          Design the architecture, refine it, then generate your project files.
        </p>

        {/* Textarea */}
        <form onSubmit={handleSubmit} className="mt-10 space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. A food delivery app with real-time order tracking..."
            className="w-full min-h-[96px] px-4 py-3 bg-card border border-muted-foreground/40 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent/15 transition-all duration-150 resize-none font-mono text-sm"
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-5 py-2.5 bg-accent text-background rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-mono text-sm font-medium"
            >
              {isLoading ? 'Designing...' : 'Design Architecture →'}
            </button>
          </div>
        </form>

        {/* Suggestion Chips */}
        <div className="pt-4 border-t border-muted-foreground/20 space-y-3">
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-card border border-muted-foreground/30 rounded-full font-mono text-xs text-muted-foreground hover:bg-card/80 hover:border-accent/60 hover:text-foreground disabled:opacity-50 transition-all duration-300"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
