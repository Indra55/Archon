'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useWhatIfAnalysis } from '@/hooks/useWhatIfAnalysis'
import { WhatIfLanding } from './WhatIfLanding'
import { WhatIfSplitView } from './WhatIfSplitView'
import { LeftControlPanel } from './LeftControlPanel'
import { RightReportPanel } from './RightReportPanel'
import { ImpactGraph } from './ImpactGraph'
import { ServiceImpactCard } from './ServiceImpactCard'
import { ComplexityMeter } from './ComplexityMeter'
import { MitigationChecklist } from './MitigationChecklist'
import { CodeViewerModal } from './CodeViewerModal'
import { SeverityBadge } from './ServiceImpactCard'
import { Minus, Plus } from 'lucide-react'
import { ControlPanelSkeleton } from './LoadingSkeletons'


export function WhatIfPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const analysis = useWhatIfAnalysis()

    const [codeModalOpen, setCodeModalOpen] = useState(false)
    const [activeCodeRef, setActiveCodeRef] = useState<{ filename: string; line: number } | null>(null)

    // section scroll spy refs
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

    useEffect(() => {
        const scenarioParam = searchParams.get('scenario')
        if (scenarioParam && analysis.state === 'idle') {
            analysis.setScenario(scenarioParam)
            const timer = setTimeout(() => {
                analysis.submit()
            }, 300)
            return () => clearTimeout(timer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams])

    const handleCitationClick = (filename: string, line: number) => {
        setActiveCodeRef({ filename, line })
        setCodeModalOpen(true)
    }

    const setRef = (id: string, el: HTMLDivElement | null) => {
        sectionRefs.current[id] = el
    }

    return (
        <div className="w-full h-full">
            <AnimatePresence mode="wait">
                {analysis.state === 'idle' ? (
                    <motion.div
                        key="landing"
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    >
                        <WhatIfLanding
                            scenario={analysis.scenario}
                            onScenarioChange={analysis.setScenario}
                            onSubmit={analysis.submit}
                            state={analysis.state}
                            suggestedScenarios={analysis.suggestedScenarios}

                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="analyzing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <WhatIfSplitView>
                            {analysis.state === 'analyzing' || analysis.state === 'refining' ? (
                                <ControlPanelSkeleton />
                            ) : (
                                <LeftControlPanel
                                    scenario={analysis.scenario}
                                    visibleSections={analysis.visibleSections}
                                    activeSectionId={analysis.activeSectionId}
                                    onNavigate={(id) => {
                                        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                    }}
                                    onRefine={analysis.refine}
                                    onFollowUp={analysis.submitFollowUp}
                                    state={analysis.state}
                                    quickStats={analysis.quickStats}
                                    sectionMeta={analysis.sectionMeta}
                                />
                            )}


                            <RightReportPanel
                                scenario={analysis.scenario}
                                visibleSections={analysis.visibleSections}
                                activeSectionId={analysis.activeSectionId}
                                onSectionInView={analysis.setActiveSectionId}
                                onCitationClick={handleCitationClick}
                                analysisState={analysis.state}
                                checklistState={analysis.checklistState}
                                onChecklistToggle={analysis.toggleChecklistItem}
                                followUps={analysis.followUps}
                                onNavigate={router.push}
                                sectionRefs={sectionRefs}
                            >
                                {/* Dynamically render sections using AnimatePresence */}
                                {analysis.visibleSections.includes('impact-graph') && (
                                    <motion.div ref={(el) => { setRef('impact-graph', el) }} id="impact-graph" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                                        <ImpactGraph 
                                            nodes={analysis.impactGraph?.nodes} 
                                            edges={analysis.impactGraph?.edges} 
                                        />

                                    </motion.div>
                                )}

                                {analysis.visibleSections.includes('directly-broken') && (
                                    <motion.div ref={(el) => { setRef('directly-broken', el) }} id="directly-broken" className="px-6 pb-6 pt-4 scroll-mt-20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-sans font-semibold text-primary">Directly Broken Services</h3>
                                            <div className="bg-elevated border rounded-full px-2 py-0.5 font-mono text-[10px] text-secondary">
                                                {analysis.report?.impact_analysis?.directly_broken_services?.length || 0}
                                            </div>
                                        </div>
                                        {analysis.report?.impact_analysis?.directly_broken_services?.map((service: any) => (
                                            <ServiceImpactCard key={service.id} service={service} variant="direct" onCitationClick={handleCitationClick} />

                                        ))}
                                    </motion.div>
                                )}

                                {analysis.visibleSections.includes('transitively-affected') && (
                                    <motion.div ref={(el) => { setRef('transitively-affected', el) }} id="transitively-affected" className="px-6 pb-6 pt-4 scroll-mt-20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-sans font-semibold text-primary">Transitively Affected</h3>
                                            <div className="bg-elevated border rounded-full px-2 py-0.5 font-mono text-[10px] text-secondary">
                                                {analysis.report?.impact_analysis?.transitively_affected?.length || 0}
                                            </div>
                                        </div>
                                        {analysis.report?.impact_analysis?.transitively_affected?.map((service: any) => (
                                            <ServiceImpactCard key={service.id} service={service} variant="transitive" onCitationClick={handleCitationClick} />

                                        ))}
                                    </motion.div>
                                )}

                                {analysis.visibleSections.includes('api-clients') && (
                                    <motion.div ref={(el) => { setRef('api-clients', el) }} id="api-clients" className="px-6 pb-6 pt-4 scroll-mt-20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-sans font-semibold text-primary">Affected API Clients</h3>
                                            <div className="bg-elevated border rounded-full px-2 py-0.5 font-mono text-[10px] text-secondary">
                                                {analysis.report?.impact_analysis?.affected_api_clients?.length || 0}

                                            </div>
                                        </div>

                                        <div className="bg-surface border border-dim rounded-xl overflow-hidden w-full">
                                            <div className="flex items-center bg-elevated px-5 py-2.5 border-b border-dim font-mono text-xs uppercase tracking-widest text-muted">
                                                <div className="w-[30%]">CLIENT</div>
                                                <div className="w-[15%]">IMPACT</div>
                                                <div className="w-[55%]">HOW USED</div>
                                            </div>
                                            <div className="flex flex-col">
                                                {analysis.report?.impact_analysis?.affected_api_clients?.map((client: any, idx: number) => (
                                                    <motion.div key={client.client_name || idx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }} className="flex items-center px-5 py-3.5 border-b border-dim last:border-0 hover:bg-elevated/40 transition-colors">
                                                        <div className="w-[30%] font-mono text-sm text-primary font-medium">{client.client_name}</div>
                                                        <div className="w-[15%]"><SeverityBadge level={client.impact?.toLowerCase() as any} /></div>
                                                        <div className="w-[55%] font-mono text-xs text-secondary leading-snug">{client.how_used}</div>

                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {analysis.visibleSections.includes('schema-changes') && (
                                    <motion.div ref={(el) => { setRef('schema-changes', el) }} id="schema-changes" className="px-6 pb-6 pt-4 scroll-mt-20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-sans font-semibold text-primary">Schema Changes Required</h3>
                                            <div className="bg-elevated border border-dim rounded-full px-2 py-0.5 font-mono text-[10px] text-secondary">
                                                {analysis.report?.schema_changes_required?.after?.length || 0}
                                            </div>

                                        </div>

                                        <div className="grid grid-cols-2 gap-3 bg-surface border border-dim rounded-xl overflow-hidden">
                                            {/* Left: Before */}
                                            <div className="flex flex-col">
                                                <div className="bg-red/10 px-4 py-2 border-b border-r border-dim flex items-center gap-2">
                                                    <Minus className="w-[12px] h-[12px] text-red" />
                                                    <span className="font-mono text-xs text-red">Before</span>
                                                </div>
                                                <div className="bg-base/40 p-4 border-r border-dim flex-1">
                                                    {analysis.report?.schema_changes_required?.before?.map((item: any, i: number) => (
                                                        <div key={i} className="text-[12px] leading-relaxed text-secondary whitespace-pre font-mono">
                                                            {typeof item === 'string' ? (item || <br />) : `${item.entity}.${item.field}: ${item.type} (${item.constraints})`}

                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Right: After */}
                                            <div className="flex flex-col">
                                                <div className="bg-green/10 px-4 py-2 border-b border-dim flex items-center gap-2">
                                                    <Plus className="w-[12px] h-[12px] text-green" />
                                                    <span className="font-mono text-xs text-green">After</span>
                                                </div>
                                                <div className="bg-base/40 p-4 flex-1">
                                                    {analysis.report?.schema_changes_required?.after?.map((item: any, i: number) => {
                                                        const text = typeof item === 'string' ? item : `${item.entity}.${item.field}: ${item.type} (${item.constraints})`
                                                        let color = "text-secondary"
                                                        if (text.includes("NEW") || text.includes("new")) color = "text-green"
                                                        else if (text.includes("deprecated")) color = "text-amber"

                                                        return (
                                                            <div key={i} className={`text-[12px] leading-relaxed whitespace-pre font-mono ${color}`}>
                                                                {text || <br />}

                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {analysis.visibleSections.includes('complexity') && (
                                    <motion.div ref={(el) => { setRef('complexity', el) }} id="complexity" className="scroll-mt-20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                                        <ComplexityMeter value={analysis.complexityScore || 0} explanation={analysis.report?.ai_explanation?.why_complexity_is_high} />

                                    </motion.div>
                                )}

                                {analysis.visibleSections.includes('mitigation') && (
                                    <motion.div ref={(el) => { setRef('mitigation', el) }} id="mitigation" className="scroll-mt-20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                                        <MitigationChecklist 
                                            steps={(analysis.report?.suggested_mitigation_steps || []).map((s: any) => ({ 
                                                id: s.step, 
                                                text: s.description || s.title,
                                                actionType: s.actionType,
                                                actionLabel: s.actionLabel,
                                                navigateTo: s.navigateTo
                                            }))} 
                                            checkedIds={analysis.checklistState} 
                                            onToggle={analysis.toggleChecklistItem} 
                                            onNavigate={router.push}
                                        />

                                    </motion.div>
                                )}

                            </RightReportPanel>
                        </WhatIfSplitView>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {codeModalOpen && activeCodeRef && (
                    <CodeViewerModal
                        isOpen={codeModalOpen}
                        filename={activeCodeRef.filename}
                        line={activeCodeRef.line}
                        onClose={() => setCodeModalOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
