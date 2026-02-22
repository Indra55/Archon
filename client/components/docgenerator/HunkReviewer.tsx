import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import type { Hunk } from '@/hooks/useDocGenerator'

interface HunkReviewerProps {
    currentHunkIndex: number
    totalHunkCount: number
    hunk: Hunk
    summary: string
    onAccept: () => void
    onReject: () => void
    onSkip: () => void
}

export function HunkReviewer({
    currentHunkIndex,
    totalHunkCount,
    hunk,
    summary,
    onAccept,
    onReject,
    onSkip
}: HunkReviewerProps) {

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowRight') {
                onAccept()
            } else if (e.key === 'r' || e.key === 'R' || e.key === 'ArrowLeft') {
                onReject()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onAccept, onReject])

    return (
        <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-0 left-0 w-full z-10 bg-[#111]/95 backdrop-blur-md border-t border-[#2A2A2A] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
            <div className="flex-1">
                <div className="font-mono text-[10px] sm:text-xs text-gray-500 mb-1">
                    Reviewing hunk {currentHunkIndex + 1} of {totalHunkCount}
                </div>
                <div className="font-mono text-xs sm:text-sm text-gray-200 font-medium">
                    {summary || 'No summary provided.'}
                </div>
            </div>

            <div className="flex items-center gap-1.5 opacity-50 xl:opacity-100">
                {Array.from({ length: totalHunkCount }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${i === currentHunkIndex
                                ? 'bg-[#6366F1] animate-pulse'
                                : 'bg-[#2A2A2A]'
                            }`}
                    />
                ))}
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onSkip}
                    className="font-mono text-[10px] sm:text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                    Skip
                </button>

                <button
                    onClick={onReject}
                    className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg px-4 py-2 font-mono text-sm hover:bg-red-500/20 transition-colors flex items-center gap-2"
                >
                    <span>Reject</span>
                    <X size={14} />
                </button>

                <button
                    onClick={onAccept}
                    className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg px-4 py-2 font-mono text-sm hover:bg-green-500/20 transition-colors flex items-center gap-2"
                >
                    <span>Accept</span>
                    <Check size={14} />
                </button>
            </div>
        </motion.div>
    )
}
