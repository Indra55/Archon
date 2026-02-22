import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, GitCommit, ExternalLink, Info } from 'lucide-react'
import type { ReviewMode, Hunk } from '@/hooks/useDocGenerator'
import { HUNK_REASONING } from '@/data/docGeneratorMockData'

interface ContextSidebarProps {
    isOpen: boolean
    onClose: () => void
    selectedDocId: string | null
    reviewMode: ReviewMode
    hunks: Hunk[]
    currentHunkIndex: number
    onPrevHunk: () => void
    onNextHunk: () => void
}

export function ContextSidebar({
    isOpen,
    onClose,
    selectedDocId,
    reviewMode,
    hunks,
    currentHunkIndex,
    onPrevHunk,
    onNextHunk
}: ContextSidebarProps) {
    const currentHunk = hunks[currentHunkIndex]
    const reasoning = selectedDocId && currentHunk
        ? (HUNK_REASONING[selectedDocId] as any)?.[currentHunk.id]
        : null

    const renderContent = () => {
        if (!selectedDocId || !currentHunk || !reasoning) {
            if (reviewMode === 'full') {
                const firstReasoning = selectedDocId ? (HUNK_REASONING[selectedDocId] as any)?.[1] : null;
                if (firstReasoning) {
                    return (
                        <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                            <Info size={40} className="text-gray-500 mb-4" />
                            <p className="font-mono text-sm text-gray-400">
                                Switch to hunk-by-hunk review to see per-change reasoning.
                            </p>
                        </div>
                    )
                }
            }

            return (
                <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                    <p className="font-mono text-sm text-gray-500">
                        No specific change reasoning available for this document.
                    </p>
                </div>
            )
        }

        return (
            <div className="flex flex-col h-full overflow-y-auto">
                <div className="px-4 py-4 flex-1">
                    {/* Section 1 */}
                    <div className="mb-6">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#A1A1A1] mb-3">
                            Triggered By
                        </h4>
                        <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A]">
                            <div className="flex items-center gap-2 mb-2">
                                <GitCommit size={14} className="text-gray-500" />
                                <span className="font-mono text-xs text-[#6366F1]">
                                    {reasoning.commitRef}
                                </span>
                            </div>
                            <p className="font-mono text-xs sm:text-sm text-gray-100 leading-snug">
                                {reasoning.commitMessage}
                            </p>
                            <p className="font-mono text-[10px] sm:text-xs text-gray-400 mt-2 leading-relaxed">
                                {reasoning.trigger}
                            </p>
                        </div>
                    </div>

                    {/* Section 2 */}
                    <div className="mb-6">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#A1A1A1] mb-2">
                            Confidence
                        </h4>
                        {reasoning.confidence === 'high' && (
                            <>
                                <div className="inline-flex bg-green-500/10 text-green-500 border border-green-500/20 rounded-full px-3 py-1 font-mono text-xs font-bold mb-1">
                                    HIGH
                                </div>
                                <p className="font-mono text-[10px] text-gray-500 mt-1">
                                    AI is confident — direct code evidence found
                                </p>
                            </>
                        )}
                        {reasoning.confidence === 'medium' && (
                            <>
                                <div className="inline-flex bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full px-3 py-1 font-mono text-xs font-bold mb-1">
                                    MEDIUM
                                </div>
                                <p className="font-mono text-[10px] text-gray-500 mt-1">
                                    AI is reasonably confident — indirect evidence
                                </p>
                            </>
                        )}
                        {reasoning.confidence === 'low' && (
                            <>
                                <div className="inline-flex bg-red-500/10 text-red-500 border border-red-500/20 rounded-full px-3 py-1 font-mono text-xs font-bold mb-1">
                                    LOW
                                </div>
                                <p className="font-mono text-[10px] text-gray-500 mt-1">
                                    AI inferred this — manual review recommended
                                </p>
                            </>
                        )}
                    </div>

                    {/* Section 3 */}
                    <div>
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#A1A1A1] mb-2">
                            Triggering Code
                        </h4>
                        <div className="bg-[#111] border border-[#2A2A2A] rounded-xl p-4 overflow-x-auto">
                            <pre className="font-mono text-xs text-gray-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                <code>{reasoning.triggeringCode}</code>
                            </pre>
                        </div>
                        <a href="/dashboard/codebase-qa" className="inline-flex items-center gap-1.5 mt-2 text-[#6366F1] font-mono text-[10px] sm:text-xs hover:underline">
                            <ExternalLink size={11} />
                            View in Codebase →
                        </a>
                    </div>
                </div>

                {/* Bottom Nav inside Sidebar (only hunk mode) */}
                {reviewMode === 'hunk' && hunks.length > 0 && (
                    <div className="sticky bottom-0 border-t border-[#2A2A2A] bg-[#111] px-4 py-3 flex items-center justify-between z-10 flex-shrink-0">
                        <button
                            onClick={onPrevHunk}
                            disabled={currentHunkIndex === 0}
                            className="font-mono text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            ← Prev
                        </button>

                        <span className="font-mono text-[10px] sm:text-xs text-gray-400">
                            Hunk {currentHunkIndex + 1} / {hunks.length}
                        </span>

                        <button
                            onClick={onNextHunk}
                            disabled={currentHunkIndex === hunks.length - 1}
                            className="font-mono text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <motion.div
            initial={false}
            animate={{ width: isOpen ? 280 : 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-[#111] overflow-hidden flex-shrink-0 z-30 ring-l ring-[#2A2A2A] flex flex-col"
            style={{ borderLeft: isOpen ? '1px solid #2A2A2A' : 'none' }}
        >
            <div className="h-12 border-b border-[#2A2A2A] px-4 flex items-center flex-shrink-0 min-w-[280px]">
                <h3 className="font-['Syne'] text-sm font-semibold text-gray-100 flex-1 truncate">
                    Change Reasoning
                </h3>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-200 transition-colors p-1"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-hidden relative min-w-[280px]">
                {renderContent()}
            </div>
        </motion.div>
    )
}
