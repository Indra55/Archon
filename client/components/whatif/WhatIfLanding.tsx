'use client'

import React, { useRef } from 'react'
import { AnalysisState } from '@/hooks/useWhatIfAnalysis'
import { Loader2 } from 'lucide-react'

interface WhatIfLandingProps {
    scenario: string
    onScenarioChange: (val: string) => void
    onSubmit: () => void
    state: AnalysisState
    suggestedScenarios: string[]
}

export function WhatIfLanding({ scenario, onScenarioChange, onSubmit, state, suggestedScenarios }: WhatIfLandingProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const chips = suggestedScenarios.length > 0 ? suggestedScenarios : [

        "Deprecate /v1/payments/charge",
        "Remove userId from Order schema",
        "Shut down the Notification Worker",
        "Change auth token from JWT to opaque string"
    ]

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onScenarioChange(e.target.value)
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }

    const handleChipClick = (text: string) => {
        onScenarioChange(text)
        if (textareaRef.current) {
            textareaRef.current.value = text
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
            textareaRef.current.focus()
        }
    }

    return (
        <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6 transition-all">
            <h1 className="font-sans text-5xl font-bold text-center bg-linear-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                What happens if you change this?
            </h1>

            <p className="font-mono text-sm text-secondary text-center mt-3 max-w-[520px]">
                Describe a proposed change. I'll show you what breaks, what's affected,
                and how far the damage travels.
            </p>

            <div className="max-w-[680px] w-full mt-10 relative">
                <textarea
                    ref={textareaRef}
                    value={scenario}
                    onChange={handleChange}
                    className="w-full min-h-[96px] bg-surface border border-dim rounded-xl p-4 font-mono text-sm text-primary resize-none outline-none placeholder:text-muted transition-all duration-150 focus:border-amber-500/60 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.10)] scrollbar-none"
                    placeholder="e.g. Deprecate the /v1/payments/charge endpoint... or change the userId field type from integer to UUID..."
                />

                <div className="flex flex-wrap gap-2 mt-4">
                    {chips.map((chip, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleChipClick(chip)}
                            className="bg-surface border border-dim border-l-2 border-l-amber-500/40 rounded-lg px-3 py-2 font-mono text-xs text-secondary cursor-pointer hover:bg-elevated hover:border-r-focus hover:border-y-focus hover:border-l-amber-500/60 transition duration-150"
                        >
                            {chip}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end mt-3">
                    <button
                        onClick={onSubmit}
                        disabled={!scenario.trim() || state === 'analyzing'}
                        className="flex items-center gap-2 bg-primary text-black font-mono text-sm font-semibold px-4 py-2 rounded-lg transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"

                    >
                        {state === 'analyzing' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        Analyze Impact →
                    </button>
                </div>
            </div>
        </div>
    )
}
