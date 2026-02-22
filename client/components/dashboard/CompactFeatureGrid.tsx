'use client'

import React from 'react'
import { FEATURES } from '@/lib/mockData'
import { useRouter } from 'next/navigation'
import * as LucideIcons from 'lucide-react'

// Map strings like "BrainCircuit" to actual React components
const iconMap: Record<string, React.ElementType> = {
    BrainCircuit: LucideIcons.BrainCircuit,
    SearchCode: LucideIcons.SearchCode,
    Network: LucideIcons.Network,
    Zap: LucideIcons.Zap,
    FileEdit: LucideIcons.FileEdit,
    ShieldCheck: LucideIcons.ShieldCheck,
    Compass: LucideIcons.Compass,
    GitBranch: LucideIcons.GitBranch,
    Bandage: LucideIcons.Bandage,
}

export function CompactFeatureGrid() {
    const router = useRouter()

    return (
        <div className="bg-surface border border-dim rounded-xl p-5 flex flex-col h-full">
            <div className="flex items-center mb-4">
                <h3 className="font-sans text-sm font-semibold text-primary">Features</h3>
                <span className="ml-auto font-mono text-[11px] text-muted">{FEATURES.length} features</span>

            </div>

            <div className="grid grid-cols-3 grid-rows-3 gap-2 flex-1">
                {FEATURES.map((feature) => {
                    const IconComp = iconMap[feature.icon] || LucideIcons.Box

                    return (
                        <div
                            key={feature.id}
                            onClick={() => router.push(feature.route)}
                            className="bg-elevated border border-dim rounded-lg p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-focus transition-colors relative"
                        >
                            <IconComp className="w-4 h-4 text-muted" />
                            <span className="font-mono text-[10px] sm:text-[11px] text-primary font-medium leading-snug text-center line-clamp-2 px-1">
                                {feature.name}
                            </span>

                            <div
                                className={`w-1.5 h-1.5 rounded-full absolute top-2 right-2 ${feature.status === 'coming_soon' ? 'bg-amber animate-pulse' : 'bg-green'
                                    }`}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
