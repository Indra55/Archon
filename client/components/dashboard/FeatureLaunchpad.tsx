'use client'

import React from 'react'
import { FEATURES } from '@/lib/mockData'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import * as LucideIcons from 'lucide-react'

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

export function FeatureLaunchpad() {
    const router = useRouter()

    const sections = [
        { name: 'Core', title: 'CORE FEATURES', color: 'accent' },
        { name: 'Tools', title: 'TOOLS', color: 'amber' },
        { name: 'Explore', title: 'EXPLORE', color: 'purple' }
    ]

    let delayIndex = 0

    return (
        <div className="w-full mt-6">
            <div className="mb-5">
                <h2 className="font-sans text-2xl font-bold text-primary tracking-tight">All Features</h2>
                <p className="font-mono text-sm text-secondary mt-1">
                    Click any feature to open it. Features marked 'In Development'
                    will become active as they are built.
                </p>
            </div>

            <div className="flex flex-col gap-6">
                {sections.map((section, sIdx) => {
                    const sectionFeatures = FEATURES.filter(f => f.category === section.name)
                    if (!sectionFeatures.length) return null

                    return (
                        <div key={section.name} className={sIdx > 0 ? 'mt-4' : ''}>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                                    {section.title}
                                </span>
                                <div className="flex-1 h-px bg-border" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sectionFeatures.map((feature) => {
                                    const IconComp = iconMap[feature.icon] || LucideIcons.Box
                                    const currentDelay = delayIndex++

                                    return (
                                        <motion.div
                                            key={feature.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: currentDelay * 0.05 }}
                                            onClick={() => router.push(feature.route)}
                                            className="bg-surface border border-dim rounded-2xl p-6 cursor-pointer group hover:border-focus hover:-translate-y-0.5 shadow-sm hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-200"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className={`w-10 h-10 rounded-xl bg-elevated flex items-center justify-center shrink-0`}>
                                                    <IconComp className={`w-5 h-5 text-${section.color === 'accent' ? 'accent' : section.color === 'amber' ? 'amber' : 'purple'}`} />
                                                </div>

                                                {feature.status === 'coming_soon' ? (
                                                    <div className="bg-elevated border border-dim rounded-full px-2.5 py-1 font-mono text-[10px] text-muted flex items-center gap-1.5 shrink-0">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                                                        In Dev
                                                    </div>
                                                ) : (
                                                    <div className="bg-green/10 text-green border border-green/20 rounded-full px-2.5 py-1 font-mono text-[10px] flex items-center gap-1.5 shrink-0">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green" />
                                                        Live
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4">
                                                <h3 className="font-sans text-base font-bold text-primary tracking-tight">
                                                    {feature.name}
                                                </h3>
                                                <p className="font-mono text-[12px] text-secondary mt-2 leading-relaxed line-clamp-3 min-h-[54px]">
                                                    {feature.description}
                                                </p>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-dim flex items-center justify-between">
                                                <div className="bg-elevated rounded px-2 py-0.5 font-mono text-[10px] text-muted">
                                                    {feature.category}
                                                </div>
                                                <div className="font-mono text-[11px] font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Open →
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
