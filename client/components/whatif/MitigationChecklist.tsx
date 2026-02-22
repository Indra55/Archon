'use client'

import React from 'react'
import { CheckCircle, ExternalLink, ArrowUpRight, CheckSquare, CheckSquare as CheckSquare2 } from 'lucide-react'

interface MitigationStep {
    id: number
    text: string
    actionType?: 'navigate' | 'task'
    actionLabel?: string
    navigateTo?: string
}

interface MitigationChecklistProps {
    steps: MitigationStep[]
    checkedIds: Record<number, boolean>
    onToggle: (id: number) => void
    onNavigate: (route: string) => void
}

export function MitigationChecklist({ steps, checkedIds, onToggle, onNavigate }: MitigationChecklistProps) {

    return (
        <div id="mitigation" className="px-6 pb-8 scroll-mt-20">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-sans font-semibold text-primary">Suggested Mitigation Steps</h3>
                <div className="bg-elevated border border-dim rounded-full px-2 py-0.5 font-mono text-[10px] text-secondary">
                    {steps.length}
                </div>
            </div>

            <div className="flex flex-col">
                {steps.map((step, idx) => {
                    const isChecked = !!checkedIds[step.id]

                    return (
                        <div key={step.id} className="flex items-start gap-4 py-4 border-b border-dim last:border-0 transition-all duration-300">
                            <div
                                className={`w-[24px] h-[24px] rounded-full shrink-0 flex items-center justify-center transition-all duration-200 border ${isChecked ? 'bg-green border-green' : 'bg-elevated border-dim'
                                    }`}
                            >
                                {isChecked ? (
                                    <CheckCircle className="w-[14px] h-[14px] text-white" />
                                ) : (
                                    <span className="font-mono text-[10px] text-secondary">{idx + 1}</span>
                                )}
                            </div>

                            <div className="flex-1">
                                <p className={`font-mono text-sm transition-colors duration-200 leading-relaxed ${isChecked ? 'text-muted line-through' : 'text-primary'
                                    }`}>
                                    {step.text}
                                </p>
                                 {(step as any).actionType && (
                                    <button
                                        onClick={() => {
                                            if ((step as any).actionType === 'navigate') {
                                                onNavigate((step as any).navigateTo!)
                                            } else {
                                                alert("Coming soon")
                                            }
                                        }}
                                        className="mt-2 flex items-center gap-1.5 border border-dim bg-transparent hover:border-focus text-secondary hover:text-primary transition-colors rounded-lg px-3 py-1.5 font-mono text-xs"
                                    >
                                        {(step as any).actionType === 'navigate' ? (
                                            <ExternalLink className="w-3 h-3" />
                                        ) : (
                                            <ArrowUpRight className="w-3 h-3" />
                                        )}
                                        {(step as any).actionLabel}
                                    </button>
                                )}

                            </div>

                            <div
                                className="cursor-pointer hover:text-primary transition-colors p-1"
                                onClick={() => onToggle(step.id)}
                            >
                                {isChecked ? (
                                    <CheckSquare2 className="w-[18px] h-[18px] text-green" />
                                ) : (
                                    <CheckSquare className="w-[18px] h-[18px] text-muted" />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
