'use client'

import React from 'react'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { CitationChip } from '@/components/shared/CitationChip'
export function SeverityBadge({ level }: { level: "critical" | "high" | "medium" | "low" | "breaking" | "partial" | "none" | string }) {
    const normalized = level?.toLowerCase() || 'medium'
    const map: Record<string, string> = {
        critical: "bg-red/10 text-red border border-red/20",
        high: "bg-red/10 text-red border border-red/20",
        breaking: "bg-red/10 text-red border border-red/20",
        medium: "bg-amber/10 text-amber border border-amber/20",
        partial: "bg-amber/10 text-amber border border-amber/20",
        low: "bg-green/10 text-green border border-green/20",
        none: "bg-green/10 text-green border border-green/20",
    }
    return (
        <div className={`${map[normalized] || map.medium} rounded-full px-2.5 py-0.5 font-mono text-xs font-bold uppercase`}>
            {level}
        </div>
    )
}

interface ServiceImpactCardProps {
    service: any
    variant: "direct" | "transitive"
    onCitationClick: (filename: string, line: number) => void
}

export function ServiceImpactCard({ service, variant, onCitationClick }: ServiceImpactCardProps) {
    const isDirect = variant === "direct"
    const Icon = isDirect ? AlertCircle : AlertTriangle
    const borderColor = isDirect ? 'border-red' : 'border-amber-500'
    const iconColor = isDirect ? 'text-red' : 'text-amber'

    // Support both old and new field names
    const reason = service.reason || service.impact_reason || service.breaking_change || ''
    const chain = service.dependency_path || service.chain || []
    const locations = service.locations || []
    const componentType = service.type || ''

    return (
        <div className={`bg-surface rounded-xl overflow-hidden mb-4 border border-dim border-l-4 ${borderColor}`}>
            <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    <h4 className="font-sans text-sm font-bold text-primary ml-2">{service.name}</h4>
                    {componentType && (
                        <span className="ml-2 font-mono text-[10px] text-muted bg-elevated rounded px-1.5 py-0.5 uppercase">{componentType}</span>
                    )}
                </div>
                <SeverityBadge level={service.severity as any} />
            </div>

            <div className="px-5 pb-4">
                <div className="font-mono text-xs uppercase tracking-widest text-muted mt-1 mb-2">
                    {isDirect ? "WHY BROKEN:" : "HOW AFFECTED:"}
                </div>
                <p className="font-mono text-sm text-secondary leading-relaxed max-w-[90%]">
                    {reason}
                </p>

                {isDirect && service.breaking_change && service.breaking_change !== reason && (
                    <div className="mt-2">
                        <div className="font-mono text-xs uppercase tracking-widest text-muted mb-1">BREAKING CHANGE:</div>
                        <p className="font-mono text-xs text-red/80 leading-relaxed">{service.breaking_change}</p>
                    </div>
                )}

                {isDirect && locations.length > 0 && (
                    <div className="mt-3">
                        <div className="font-mono text-xs uppercase tracking-widest text-muted mb-2">
                            CALLED IN {locations.length} LOCATIONS:
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {locations.map((loc: any, idx: number) => (
                                <CitationChip
                                    key={idx}
                                    filename={loc.filename}
                                    line={typeof loc.line === 'number' ? loc.line : 1}
                                    onClick={() => onCitationClick(loc.filename, typeof loc.line === 'number' ? loc.line : 1)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {!isDirect && chain.length > 0 && (
                    <div className="mt-3">
                        <div className="font-mono text-xs uppercase tracking-widest text-muted mb-2">
                            DEPENDENCY CHAIN:
                        </div>
                        <div className="flex items-center flex-wrap gap-1">
                            {chain.map((c: string, i: number) => (
                                <React.Fragment key={i}>
                                    {i > 0 && <span className="font-mono text-xs text-muted">→</span>}
                                    <span className={`font-mono text-xs ${i === chain.length - 1 ? 'text-red' : 'text-secondary'}`}>
                                        {c}
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {(service.effort || service.owner) && (
                <div className="px-5 pb-4 pt-3 border-t border-dim flex items-center gap-6">
                    {service.effort && <div className="font-mono text-xs text-secondary">Effort: {service.effort}</div>}
                    {service.owner && <div className="font-mono text-xs text-secondary">Owner: {service.owner}</div>}
                </div>
            )}
        </div>
    )
}
