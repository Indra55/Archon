'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Share2, Info } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { FollowUpExchange, SectionId, AnalysisState } from '@/hooks/useWhatIfAnalysis'
import { ReportSkeleton } from './LoadingSkeletons'


interface RightReportPanelProps {
    scenario: string
    visibleSections: SectionId[]
    activeSectionId: SectionId | null
    onSectionInView: (id: SectionId) => void
    onCitationClick: (filename: string, line: number) => void
    analysisState: AnalysisState
    checklistState: Record<number, boolean>
    onChecklistToggle: (id: number) => void
    followUps: FollowUpExchange[]
    onNavigate: (route: string) => void
    children?: React.ReactNode // Sections will be passed dynamically here to keep this wrapper clean
    sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
}

export function RightReportPanel({
    scenario,
    visibleSections,
    activeSectionId,
    onSectionInView,
    onCitationClick,
    analysisState,
    followUps,
    children,
    sectionRefs
}: RightReportPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    // Scroll spy effect
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            let maxRatio = 0
            let maxSection: SectionId | null = null

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.intersectionRatio > maxRatio) {
                        maxRatio = entry.intersectionRatio
                        maxSection = entry.target.id as SectionId
                    }
                }
            })

            if (maxSection) onSectionInView(maxSection)
        }, {
            root: scrollRef.current,
            threshold: [0.2, 0.4, 0.6, 0.8]
        })

        Object.values(sectionRefs.current).forEach(el => {
            if (el) observer.observe(el)
        })

        return () => observer.disconnect()
    }, [sectionRefs, visibleSections, onSectionInView])

    const isAnalyzing = analysisState === 'analyzing' || analysisState === 'refining'
    const hasData = visibleSections.length > 0 || followUps.length > 0

    return (
        <div ref={scrollRef} className="w-full h-[calc(100vh-56px)] overflow-y-auto overflow-x-hidden bg-base relative scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

            {/* Top Bar */}
            <div className="sticky top-0 bg-base/90 backdrop-blur-md border-b border-dim px-6 h-[48px] flex items-center justify-between z-10 shrink-0">
                <h2 className="font-mono text-sm font-semibold text-primary">Impact Analysis Report</h2>

                <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg px-3 py-1 font-mono text-xs max-w-[50%] truncate">
                    {scenario.length > 48 ? `${scenario.slice(0, 48)}...` : scenario}
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => alert('Export coming soon')} className="flex items-center gap-1.5 border border-dim bg-transparent hover:bg-elevated px-2 py-1.5 rounded-lg text-secondary hover:text-primary transition-colors">
                        <Download className="w-[14px] h-[14px]" />
                        <span className="font-mono text-xs">Export</span>
                    </button>
                    <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="flex items-center gap-1.5 border border-dim bg-transparent hover:bg-elevated px-2 py-1.5 rounded-lg text-secondary hover:text-primary transition-colors">
                        <Share2 className="w-[14px] h-[14px]" />
                        <span className="font-mono text-xs">Share</span>
                    </button>
                </div>
            </div>

            <div className="pb-32 pt-4">
                {isAnalyzing ? (
                    <ReportSkeleton />
                ) : !hasData && analysisState === 'complete' ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="w-16 h-16 bg-elevated rounded-full flex items-center justify-center mb-4 border border-dim">
                            <Info className="w-8 h-8 text-muted" />
                        </div>
                        <h3 className="text-primary font-semibold mb-2">No Impact Detected</h3>
                        <p className="text-secondary max-w-sm text-sm">
                            Our analysis suggests this change has a minimal blast radius or is isolated from other components.
                        </p>
                    </div>
                ) : (
                    children
                )}


                {/* Follow Ups */}
                {followUps.map((exchange, idx) => (
                    <div key={idx} className="px-6 flex flex-col">
                        <div className="flex items-center gap-4 my-6 opacity-60">
                            <hr className="flex-1 border-dim" />
                            <div className="font-mono text-xs text-muted">Follow-up · {exchange.timestamp}</div>
                            <hr className="flex-1 border-dim" />
                        </div>

                        <div className="ml-auto max-w-[480px] bg-elevated rounded-2xl rounded-tr-sm p-4 font-mono text-sm text-primary shadow-sm border border-dim">
                            {exchange.question}
                        </div>

                        <div className="prose prose-invert prose-sm max-w-none mt-3 w-full font-sans text-secondary leading-relaxed">

                            <TypewriterText text={exchange.answer} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function TypewriterText({ text }: { text: string }) {
    const [displayed, setDisplayed] = useState('')

    useEffect(() => {
        setDisplayed('')
        let idx = 0
        const interval = setInterval(() => {
            setDisplayed((prev: string) => prev + text.charAt(idx))
            idx++
            if (idx >= text.length) clearInterval(interval)
        }, 14)
        return () => clearInterval(interval)
    }, [text])

    return <ReactMarkdown>{displayed}</ReactMarkdown>

}
