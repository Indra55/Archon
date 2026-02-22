'use client'

import React from 'react'
import { RECENT_ACTIVITY } from '@/lib/mockData'
import {
    GitPullRequest, FileText, GitMerge, Lightbulb,
    BookMarked, AlertCircle, ArrowUpRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ActivityFeed() {
    const router = useRouter()

    const getIcon = (type: string) => {
        switch (type) {
            case 'pr_blocked':
            case 'gap_detected':
                return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-red/15 text-red shrink-0"><AlertCircle className="w-3.5 h-3.5" /></div>
            case 'docs_stale':
            case 'suggestion':
                return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-amber/15 text-amber shrink-0"><Lightbulb className="w-3.5 h-3.5" /></div>
            case 'pr_merged':
                return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-green/15 text-green shrink-0"><GitMerge className="w-3.5 h-3.5" /></div>
            case 'qa_pinned':
                return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-accent/15 text-accent shrink-0"><BookMarked className="w-3.5 h-3.5" /></div>
            case 'adr_created':
                return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-purple/15 text-purple shrink-0"><FileText className="w-3.5 h-3.5" /></div>
            default:
                return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-elevated text-muted shrink-0"><FileText className="w-3.5 h-3.5" /></div>
        }
    }

    return (
        <div className="bg-surface border border-dim rounded-xl p-5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-sans text-sm font-semibold text-primary">Recent Activity</h3>
                <span className="font-mono text-[11px] text-accent cursor-pointer hover:underline">
                    View all →
                </span>
            </div>

            <div className="flex flex-col gap-3">
                {RECENT_ACTIVITY.map((activity) => (
                    <div
                        key={activity.id}
                        onClick={() => router.push(activity.route)}
                        className="group flex items-start gap-3 py-3 border-b border-dim last:border-0 hover:bg-elevated/30 cursor-pointer transition-colors"
                    >
                        {getIcon(activity.type)}

                        <div className="flex-1">
                            <p className="font-mono text-[12px] text-primary leading-snug group-hover:text-accent transition-colors">
                                {activity.text}
                            </p>
                            <p className="font-mono text-[10px] text-muted mt-0.5">
                                {activity.time}
                            </p>
                        </div>

                        <ArrowUpRight className="w-3 h-3 text-muted shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}
            </div>
        </div>
    )
}
