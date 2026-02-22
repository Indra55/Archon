'use client'

import { CheckCircle2, AlertCircle } from 'lucide-react'

interface DecisionOption {
  title: string
  pros: string[]
  cons: string[]
  recommended?: boolean
}

interface DecisionCardProps {
  options?: DecisionOption[]
  title?: string
}

const DEFAULT_OPTIONS: DecisionOption[] = [
  {
    title: 'Option A: Monolithic',
    pros: ['Simpler deployment', 'Easier debugging'],
    cons: ['Scaling challenges', 'Technology lock-in'],
    recommended: false,
  },
  {
    title: 'Option B: Microservices',
    pros: ['Independent scaling', 'Technology flexibility'],
    cons: ['Operational complexity', 'Network latency'],
    recommended: true,
  },
]

export function DecisionCard({
  options = DEFAULT_OPTIONS,
  title = 'Architecture Decision',
}: DecisionCardProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
        {title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((option, index) => (
          <div
            key={index}
            className={`p-3 rounded border ${
              option.recommended
                ? 'border-accent/60 bg-accent/5'
                : 'border-accent/20 bg-transparent'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h5 className="text-xs font-mono text-foreground font-semibold">
                {option.title}
              </h5>
              {option.recommended && (
                <CheckCircle2 size={14} className="text-accent flex-shrink-0 mt-0.5" />
              )}
            </div>

            {/* Pros */}
            <div className="space-y-1 mb-2">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                Pros
              </p>
              <ul className="space-y-1">
                {option.pros.map((pro, i) => (
                  <li
                    key={i}
                    className="text-xs text-foreground/70 font-mono flex items-start gap-1"
                  >
                    <span className="text-accent mt-0.5">+</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                Cons
              </p>
              <ul className="space-y-1">
                {option.cons.map((con, i) => (
                  <li
                    key={i}
                    className="text-xs text-foreground/70 font-mono flex items-start gap-1"
                  >
                    <span className="text-destructive">-</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
