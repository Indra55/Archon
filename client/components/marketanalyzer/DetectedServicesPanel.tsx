'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { type DetectedService, CATEGORY_LABELS } from '@/data/marketAnalyzerMockData'
import {
    Database, Cloud, GitBranch, Activity, MessageSquare,
    Shield, Search, Globe, HardDrive, Box, FileText, Zap
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    'database': Database,
    'cloud-platform': Cloud,
    'ci-cd': GitBranch,
    'monitoring': Activity,
    'messaging': MessageSquare,
    'authentication': Shield,
    'search': Search,
    'cdn': Globe,
    'storage': HardDrive,
    'container-orchestration': Box,
    'logging': FileText,
    'caching': Zap,
}

interface DetectedServicesPanelProps {
    services: DetectedService[]
    visibleIds: string[]
    isComplete: boolean
}

export function DetectedServicesPanel({ services, visibleIds, isComplete }: DetectedServicesPanelProps) {
    const visibleServices = services.filter(s => visibleIds.includes(s.id))

    if (visibleServices.length === 0) return null

    // Group by category
    const grouped = visibleServices.reduce<Record<string, DetectedService[]>>((acc, svc) => {
        if (!acc[svc.category]) acc[svc.category] = []
        acc[svc.category].push(svc)
        return acc
    }, {})

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="px-8 py-4 border-b border-dim bg-surface/50"
        >
            <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Detected Infrastructure</span>
                <span className="font-mono text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                    {visibleServices.length} services
                </span>
            </div>

            <div className="flex flex-wrap gap-2">
                {Object.entries(grouped).map(([category, categoryServices]) => (
                    <React.Fragment key={category}>
                        {categoryServices.map((svc, idx) => {
                            const Icon = CATEGORY_ICONS[svc.category] || Cloud
                            return (
                                <motion.div
                                    key={svc.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-elevated border border-dim hover:border-accent/40 transition-colors group cursor-default"
                                >
                                    <Icon size={13} className="text-muted group-hover:text-accent transition-colors shrink-0" />
                                    <span className="font-mono text-xs text-secondary group-hover:text-primary transition-colors whitespace-nowrap">
                                        {svc.name}
                                    </span>
                                    <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                        ${svc.currentMonthlyCost.toLocaleString()}
                                    </span>
                                    <span className="font-mono text-[9px] text-muted bg-surface px-1.5 py-0.5 rounded hidden lg:inline-block">
                                        {CATEGORY_LABELS[svc.category]}
                                    </span>
                                </motion.div>
                            )
                        })}
                    </React.Fragment>
                ))}
            </div>
        </motion.div>
    )
}