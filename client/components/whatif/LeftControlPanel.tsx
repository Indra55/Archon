'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SendHorizontal } from 'lucide-react'
import { SECTION_LABELS } from '@/data/whatIfMockData'

import { SectionId, AnalysisState } from '@/hooks/useWhatIfAnalysis'

interface LeftControlPanelProps {
    scenario: string
    visibleSections: SectionId[]
    activeSectionId: SectionId | null
    onNavigate: (id: SectionId) => void
    onRefine: (val: string) => void
    onFollowUp: (val: string) => void
    state: AnalysisState
    quickStats: { directlyBroken: number; transitivelyAffected: number; affectedClients: number; riskLevel: string }
    sectionMeta: Record<string, { count?: number | string; badge?: string }>

}

export function LeftControlPanel({
    scenario,
    visibleSections,
    activeSectionId,
    onNavigate,
    onRefine,
    onFollowUp,
    state,
    quickStats,
    sectionMeta,

}: LeftControlPanelProps) {
    const [refineInput, setRefineInput] = useState('')
    const [followUpInput, setFollowUpInput] = useState('')

    const sections: SectionId[] = [
        'impact-graph', 'directly-broken', 'transitively-affected',
        'api-clients', 'schema-changes', 'complexity', 'mitigation'
    ]

    return (
        <div className="w-full h-full bg-surface border-r border-dim flex flex-col overflow-hidden sticky top-[56px]">
            {/* Zone 1: Scenario Card */}
            <div className="px-5 pt-5 pb-4 border-b border-dim shrink-0">
                <div className="border-l-4 border-amber-500 bg-elevated/40 rounded-r-xl p-4 font-mono text-sm text-primary font-medium leading-snug">
                    {scenario.length > 120 ? `${scenario.slice(0, 120)}...` : scenario}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 * 0.08 }} className="bg-elevated rounded-lg p-3 text-center">
                        <div className="font-sans text-xl font-bold text-red">{quickStats.directlyBroken}</div>
                        <div className="font-mono text-xs text-secondary mt-0.5">Directly Broken</div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 * 0.08 }} className="bg-elevated rounded-lg p-3 text-center">
                        <div className="font-sans text-xl font-bold text-amber">{quickStats.transitivelyAffected}</div>
                        <div className="font-mono text-xs text-secondary mt-0.5">Transitively Affected</div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 * 0.08 }} className="bg-elevated rounded-lg p-3 text-center">
                        <div className="font-sans text-xl font-bold text-amber">{quickStats.affectedClients}</div>
                        <div className="font-mono text-xs text-secondary mt-0.5">API Clients</div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3 * 0.08 }} className="bg-elevated rounded-lg p-3 flex flex-col items-center justify-center">
                        <div className={`rounded-lg px-2 py-1 font-mono text-xs font-bold uppercase ${
                            quickStats.riskLevel === 'CRITICAL' ? 'bg-red/10 text-red border border-red/20' :
                            quickStats.riskLevel === 'HIGH' ? 'bg-amber/10 text-amber border border-amber/20' :
                            quickStats.riskLevel === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                            'bg-green/10 text-green border border-green/20'
                        }`}>
                            {quickStats.riskLevel}
                        </div>
                        <div className="font-mono text-xs text-secondary mt-1.5">Risk Level</div>
                    </motion.div>
                </div>
            </div>

            {/* Zone 2: Navigator */}
            <div className="flex-1 overflow-y-auto scrollbar-none">
                <div className="font-mono text-xs uppercase tracking-widest text-muted px-5 pt-4 pb-2">
                    Jump to section
                </div>

                {sections.map(section => {
                    const isActive = activeSectionId === section
                    const isVisible = visibleSections.includes(section)
                    const meta = sectionMeta[section]


                    return (
                        <div
                            key={section}
                            onClick={() => isVisible && onNavigate(section)}
                            className={`px-5 py-2.5 flex items-center justify-between transition-all duration-300 ${isVisible ? 'cursor-pointer hover:bg-elevated opacity-100' : 'cursor-default opacity-35'
                                } ${isActive ? 'border-l-2 border-focus pl-[16px] text-primary font-medium bg-elevated/20' : 'pl-[20px] text-secondary'}`}
                        >
                            <div className="font-mono text-sm">{SECTION_LABELS[section]}</div>
                            {isVisible ? (
                                meta?.count ? (
                                    <div className="bg-elevated border border-dim rounded-full px-2 py-0.5 font-mono text-[10px] text-secondary">
                                        {meta.count}
                                    </div>
                                ) : meta?.badge ? (
                                    <div className="bg-amber/10 text-amber border border-amber/20 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold">
                                        {meta.badge}
                                    </div>
                                ) : null
                            ) : (
                                <div className="w-2 h-2 rounded-full bg-muted animate-pulse mr-2" />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Zone 3: Inputs */}
            <div className="border-t border-dim px-5 py-4 bg-surface shrink-0">
                <div>
                    <div className="font-mono text-xs text-muted uppercase tracking-wider mb-2">Add a constraint</div>
                    <input
                        value={refineInput}
                        onChange={e => setRefineInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && refineInput.trim() && !['analyzing', 'refining'].includes(state)) {
                                onRefine(refineInput)
                                setRefineInput('')
                            }
                        }}
                        placeholder="e.g. 'with a 90-day deprecation window'"
                        className="w-full bg-elevated border border-dim rounded-lg px-3 py-2 font-mono text-sm text-primary outline-none focus:border-focus"
                    />
                    <button
                        onClick={() => {
                            onRefine(refineInput)
                            setRefineInput('')
                        }}
                        disabled={!refineInput.trim() || ['analyzing', 'refining'].includes(state)}
                        className="w-full mt-2 py-1.5 font-mono text-xs bg-elevator border border-dim rounded-lg disabled:opacity-50 hover:bg-elevated"
                    >
                        Re-analyze
                    </button>
                </div>

                <AnimatePresence>
                    {state === 'complete' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                            <div className="font-mono text-xs text-muted uppercase tracking-wider mb-2">Ask about this report</div>
                            <div className="flex items-center gap-2">
                                <input
                                    value={followUpInput}
                                    onChange={e => setFollowUpInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && followUpInput.trim()) {
                                            onFollowUp(followUpInput)
                                            setFollowUpInput('')
                                        }
                                    }}
                                    className="flex-1 bg-elevated border border-dim rounded-lg px-3 py-2 font-mono text-sm text-primary outline-none focus:border-amber-500/60 transition-colors"
                                    placeholder="e.g. What if we add a 6-month shim?"
                                />
                                <button
                                    onClick={() => {
                                        if (followUpInput.trim()) {
                                            onFollowUp(followUpInput)
                                            setFollowUpInput('')
                                        }
                                    }}
                                    className="p-2 rounded-lg text-accent hover:bg-elevated shrink-0 transition-colors"
                                >
                                    <SendHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
