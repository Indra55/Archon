'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { TrendingDown, DollarSign, Cpu, ScanLine, Loader2 } from 'lucide-react'

function useLocalCountUp(end: number) {
    const [value, setValue] = React.useState(0)
    React.useEffect(() => {
        let startTime: number
        let frame: number
        const animate = (t: number) => {
            if (!startTime) startTime = t
            const progress = Math.min((t - startTime) / 1200, 1)
            setValue(Math.floor(end * progress))
            if (progress < 1) frame = requestAnimationFrame(animate)
            else setValue(end)
        }
        frame = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(frame)
    }, [end])
    return value
}

interface MarketAnalyzerHeaderProps {
    totalCurrentSpend: number
    totalOptimizedSpend: number
    overallSavingsPercent: number
    servicesCount: number
    isAnalyzing: boolean
    isComplete: boolean
    onAnalyze: () => void
}

export function MarketAnalyzerHeader({
    totalCurrentSpend,
    totalOptimizedSpend,
    overallSavingsPercent,
    servicesCount,
    isAnalyzing,
    isComplete,
    onAnalyze,
}: MarketAnalyzerHeaderProps) {
    const spendCounter = useLocalCountUp(isComplete ? totalCurrentSpend : 0)
    const savingsCounter = useLocalCountUp(isComplete ? overallSavingsPercent : 0)
    const svcCounter = useLocalCountUp(isComplete ? servicesCount : 0)

    return (
        <div className="px-8 py-6 border-b border-dim bg-surface flex flex-row items-center min-h-[140px] flex-shrink-0">
            {/* Icon */}
            <div className="relative shrink-0">
                <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-emerald-500/20 via-accent/20 to-purple/20 flex items-center justify-center border border-dim">
                    <TrendingDown className="w-8 h-8 text-emerald-400" />
                </div>
                {isComplete && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"
                    >
                        <span className="text-[10px] font-bold text-white">✓</span>
                    </motion.div>
                )}
            </div>

            {/* Title & subtitle */}
            <div className="flex flex-col justify-center ml-6 gap-1">
                <h1 className="font-['Syne'] text-xl font-bold text-primary">Market Analyzer</h1>
                <p className="font-mono text-xs text-muted mt-0.5">
                    AI-powered cost intelligence for your infrastructure stack
                </p>

                {/* Stat counters */}
                <div className="flex items-center gap-6 mt-4">
                    <div className="flex flex-col gap-0.5">
                        <span className="font-['Syne'] text-2xl font-bold text-primary flex items-center gap-1">
                            <DollarSign size={18} className="text-muted" />
                            {spendCounter.toLocaleString()}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">MONTHLY SPEND</span>
                    </div>

                    <div className="h-8 w-px bg-dim self-center mx-2" />

                    <div className="flex flex-col gap-0.5">
                        <span className="font-['Syne'] text-2xl font-bold text-emerald-400">{savingsCounter}%</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">SAVINGS POSSIBLE</span>
                    </div>

                    <div className="h-8 w-px bg-dim self-center mx-2" />

                    <div className="flex flex-col gap-0.5">
                        <span className="font-['Syne'] text-2xl font-bold text-accent">{svcCounter}</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">SERVICES FOUND</span>
                    </div>
                </div>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col items-end justify-center gap-3 ml-auto">
                <button
                    onClick={onAnalyze}
                    disabled={isAnalyzing}
                    className={`rounded-xl px-5 py-2.5 flex items-center gap-2 font-mono text-sm font-medium transition-all cursor-pointer ${isAnalyzing
                            ? 'bg-accent/70 text-white cursor-not-allowed'
                            : 'bg-accent text-white hover:bg-accent/90'
                        }`}
                >
                    {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
                    {isAnalyzing ? 'Analyzing...' : isComplete ? 'Re-analyze' : 'Analyze Codebase'}
                </button>
                {isComplete && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-mono text-xs text-muted"
                    >
                        Potential savings: ${(totalCurrentSpend - totalOptimizedSpend).toLocaleString()}/mo
                    </motion.span>
                )}
            </div>
        </div>
    )
}