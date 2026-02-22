'use client'

import React from 'react'

export function ReportSkeleton() {
    return (
        <div className="px-6 py-4 animate-pulse">
            {/* Graph Skeleton */}
            <div className="w-full h-[300px] bg-elevated/40 rounded-2xl mb-8 border border-dim flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-dim/50 border-t-focus animate-spin" />
            </div>

            {/* Section 1 */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-6 w-48 bg-elevated rounded" />
                    <div className="h-4 w-12 bg-elevated rounded-full" />
                </div>
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-24 w-full bg-elevated/20 rounded-xl border border-dim" />
                    ))}
                </div>
            </div>

            {/* Section 2 */}
            <div className="mb-8">
                <div className="h-6 w-32 bg-elevated rounded mb-4" />
                <div className="h-32 w-full bg-elevated/20 rounded-xl border border-dim" />
            </div>

            {/* Complexity Skeleton */}
            <div className="h-48 w-full bg-elevated/30 rounded-2xl border border-dim" />
        </div>
    )
}

export function ControlPanelSkeleton() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            <div className="h-10 w-full bg-elevated rounded-xl" />
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-8 w-full bg-elevated/40 rounded-lg" />
                ))}
            </div>
            <div className="pt-6 border-t border-dim">
                <div className="h-24 w-full bg-elevated/20 rounded-xl" />
            </div>
        </div>
    )
}
