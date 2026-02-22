'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingDown, BarChart3, Loader2 } from 'lucide-react'
import { type ServiceSuggestion } from '@/data/marketAnalyzerMockData'
import { AlternativeSuggestionCard } from './AlternativeSuggestionCard'

interface SuggestionsResultsProps {
    state: 'idle' | 'analyzing' | 'complete'
    suggestions: ServiceSuggestion[]
    costCutPercent: number
    scanProgress: number
}

function IdleState() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 px-8"
        >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/10 to-purple/10 flex items-center justify-center border border-dim mb-6">
                <TrendingDown className="w-10 h-10 text-accent/50" />
            </div>
            <h3 className="font-['Syne'] text-lg font-bold text-primary mb-2">
                Ready to Analyze
            </h3>
            <p className="font-mono text-sm text-muted text-center max-w-md">
                Click <span className="text-accent">"Analyze Codebase"</span> to scan your infrastructure,
                detect services, and discover cost-saving alternatives powered by AI.
            </p>
            <div className="flex items-center gap-4 mt-6">
                {['Database', 'Cloud', 'CI/CD', 'Monitoring', 'Messaging'].map((label) => (
                    <span
                        key={label}
                        className="font-mono text-[10px] text-muted bg-elevated px-2.5 py-1 rounded-full border border-dim"
                    >
                        {label}
                    </span>
                ))}
            </div>
        </motion.div>
    )
}

function AnalyzingState({ progress }: { progress: number }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 px-8"
        >
            <Loader2 className="w-10 h-10 text-accent animate-spin mb-6" />
            <h3 className="font-['Syne'] text-lg font-bold text-primary mb-2">
                Scanning Codebase…
            </h3>
            <p className="font-mono text-sm text-muted mb-6">
                Analyzing dependencies, infrastructure configs, and cost patterns
            </p>
            {/* Progress bar */}
            <div className="w-full max-w-md">
                <div className="h-2 rounded-full bg-elevated overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-purple"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.15 }}
                    />
                </div>
                <div className="flex justify-between mt-2">
                    <span className="font-mono text-[10px] text-muted">Scanning…</span>
                    <span className="font-mono text-[10px] text-accent">{progress}%</span>
                </div>
            </div>
        </motion.div>
    )
}

export function SuggestionsResults({ state, suggestions, costCutPercent, scanProgress }: SuggestionsResultsProps) {
    if (state === 'idle') return <IdleState />
    if (state === 'analyzing') return <AnalyzingState progress={scanProgress} />

    // ── complete state ──
    const totalAlts = suggestions.reduce((sum, s) => sum + s.alternatives.length, 0)

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-8 py-6"
        >
            {/* Summary bar */}
            <div className="flex items-center gap-3 mb-5">
                <BarChart3 size={14} className="text-accent" />
                <span className="font-mono text-xs text-secondary">
                    Showing <span className="text-primary font-medium">{totalAlts} alternatives</span>{' '}
                    across <span className="text-primary font-medium">{suggestions.length} services</span>
                </span>
                {costCutPercent > 0 && (
                    <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 ml-auto">
                        Target: ↓{costCutPercent}% cost reduction
                    </span>
                )}
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <AnimatePresence mode="popLayout">
                    {suggestions.map((suggestion, index) => (
                        <AlternativeSuggestionCard
                            key={suggestion.service.id}
                            suggestion={suggestion}
                            costCutPercent={costCutPercent}
                            index={index}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}