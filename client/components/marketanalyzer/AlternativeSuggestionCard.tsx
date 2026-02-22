'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, ArrowRight, ExternalLink, Check, X, Sparkles, AlertTriangle } from 'lucide-react'
import { type ServiceSuggestion, type Alternative, CATEGORY_LABELS } from '@/data/marketAnalyzerMockData'

const complexityColors = {
    low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    high: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
}

function SavingsBadge({ percent }: { percent: number }) {
    const color =
        percent >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
            percent >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                'text-secondary bg-elevated border-dim'

    return (
        <span className={`font-mono text-xs px-2 py-0.5 rounded-full border ${color}`}>
            ↓ {percent}%
        </span>
    )
}

function FeatureParityBar({ value }: { value: number }) {
    const color =
        value >= 90 ? 'bg-emerald-500' :
            value >= 75 ? 'bg-amber-500' :
                'bg-red-500'

    return (
        <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-1.5 rounded-full bg-elevated overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                />
            </div>
            <span className="font-mono text-[10px] text-muted shrink-0">{value}%</span>
        </div>
    )
}

function AlternativeRow({
    alt,
    costCutPercent,
    index,
}: {
    alt: Alternative
    costCutPercent: number
    index: number
}) {
    const [showDetails, setShowDetails] = useState(false)
    const cc = complexityColors[alt.migrationComplexity]

    // Highlight if this alternative meets the cost cut target
    const meetsTarget = costCutPercent > 0 && alt.savingsPercent >= costCutPercent

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            className={`rounded-lg border transition-all ${meetsTarget
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-dim bg-base hover:border-dim/80'
                }`}
        >
            {/* Main row */}
            <div className="flex items-center gap-3 px-4 py-3">
                {/* Alternative name */}
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-primary font-medium truncate">{alt.name}</span>
                        {alt.openSource && (
                            <span className="font-mono text-[9px] text-purple bg-purple/10 px-1.5 py-0.5 rounded border border-purple/20 shrink-0">
                                OSS
                            </span>
                        )}
                        {alt.freeTrialAvailable && (
                            <span className="font-mono text-[9px] text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20 shrink-0">
                                Free Trial
                            </span>
                        )}
                        {meetsTarget && (
                            <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0 flex items-center gap-0.5">
                                <Check size={9} /> Meets Target
                            </span>
                        )}
                    </div>
                    <FeatureParityBar value={alt.featureParity} />
                </div>

                {/* Cost */}
                <div className="text-right shrink-0">
                    <div className="font-['Syne'] text-base font-bold text-primary">${alt.estimatedMonthlyCost}/mo</div>
                    <SavingsBadge percent={alt.savingsPercent} />
                </div>

                {/* Migration complexity */}
                <div className={`shrink-0 px-2 py-1 rounded border ${cc.bg} ${cc.border}`}>
                    <span className={`font-mono text-[10px] uppercase ${cc.text}`}>{alt.migrationComplexity}</span>
                </div>

                {/* Expand */}
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="shrink-0 p-1.5 rounded hover:bg-elevated transition-colors cursor-pointer"
                >
                    {showDetails ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                </button>
            </div>

            {/* Expandable pros/cons */}
            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-3 pt-1 border-t border-dim/50">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400 mb-1.5 block">Pros</span>
                                    <ul className="space-y-1">
                                        {alt.pros.map((pro, i) => (
                                            <li key={i} className="flex items-start gap-1.5 font-mono text-[11px] text-secondary">
                                                <Check size={10} className="text-emerald-400 mt-0.5 shrink-0" />
                                                {pro}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <span className="font-mono text-[9px] uppercase tracking-widest text-red-400 mb-1.5 block">Cons</span>
                                    <ul className="space-y-1">
                                        {alt.cons.map((con, i) => (
                                            <li key={i} className="flex items-start gap-1.5 font-mono text-[11px] text-secondary">
                                                <X size={10} className="text-red-400 mt-0.5 shrink-0" />
                                                {con}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

interface AlternativeSuggestionCardProps {
    suggestion: ServiceSuggestion
    costCutPercent: number
    index: number
}

export function AlternativeSuggestionCard({ suggestion, costCutPercent, index }: AlternativeSuggestionCardProps) {
    const [showRationale, setShowRationale] = useState(false)
    const { service, alternatives, aiRationale } = suggestion

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.1 }}
            className="rounded-2xl border border-dim bg-surface overflow-hidden"
        >
            {/* Card header — current service */}
            <div className="px-5 pt-4 pb-3 flex items-center gap-3 border-b border-dim/50">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-purple/20 flex items-center justify-center border border-dim shrink-0">
                    <span className="font-mono text-[10px] text-accent font-bold">
                        {service.name.charAt(0)}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-['Syne'] text-sm font-bold text-primary truncate">{service.name}</h3>
                    <p className="font-mono text-[10px] text-muted truncate">{service.usageContext}</p>
                </div>
                <div className="text-right shrink-0">
                    <div className="font-['Syne'] text-lg font-bold text-primary">${service.currentMonthlyCost.toLocaleString()}</div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted">
                        {CATEGORY_LABELS[service.category]}
                    </span>
                </div>
            </div>

            {/* Detected files */}
            <div className="px-5 py-2 flex items-center gap-1.5 border-b border-dim/30">
                <span className="font-mono text-[9px] text-muted shrink-0">Found in:</span>
                {service.detectedIn.slice(0, 3).map((file, i) => (
                    <span key={i} className="font-mono text-[10px] text-accent/80 bg-accent/5 px-1.5 py-0.5 rounded">
                        {file}
                    </span>
                ))}
                {service.detectedIn.length > 3 && (
                    <span className="font-mono text-[9px] text-muted">+{service.detectedIn.length - 3} more</span>
                )}
                <span className="ml-auto font-mono text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {service.confidence}% confidence
                </span>
            </div>

            {/* Alternatives */}
            <div className="px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                    <ArrowRight size={12} className="text-accent" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                        {alternatives.length} Alternatives Found
                    </span>
                </div>

                {alternatives.map((alt, i) => (
                    <AlternativeRow key={alt.id} alt={alt} costCutPercent={costCutPercent} index={i} />
                ))}
            </div>

            {/* AI Rationale */}
            <div className="px-5 py-3 border-t border-dim/50">
                <button
                    onClick={() => setShowRationale(!showRationale)}
                    className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent hover:text-primary transition-colors cursor-pointer"
                >
                    <Sparkles size={12} />
                    AI Analysis
                    {showRationale ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                <AnimatePresence>
                    {showRationale && (
                        <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="font-mono text-xs text-secondary leading-relaxed mt-2 overflow-hidden"
                        >
                            {aiRationale}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}