'use client'

import React from 'react'
import { useCountUp } from '@/hooks/useCountUp'
import { LucideIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MetricCardProps {
    label: string;
    value: string | number;
    unit?: string;
    delta?: string;
    deltaPositive?: boolean | null;
    icon: LucideIcon;
    iconColor?: "accent" | "purple" | "amber" | "green" | "red" | "muted" | string;
    onClick?: () => void;
}

export function MetricCard({
    label, value, unit, delta, deltaPositive, icon: Icon, iconColor = "accent", onClick
}: MetricCardProps) {
    const router = useRouter()
    // Ensure value is number for countup, fallback to 0 if string
    const numericVal = typeof value === 'number' ? value : parseInt(value.toString()) || 0
    const displayValue = typeof value === 'number' ? useCountUp(numericVal) : value

    return (
        <div
            className={`bg-surface border border-dim rounded-xl p-4 transition-colors duration-150 ${onClick ? 'hover:border-focus cursor-pointer' : ''}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</span>
                <Icon className={`w-4 h-4 text-${iconColor}`} style={!['accent', 'purple', 'amber', 'green', 'red', 'muted'].includes(iconColor) ? { color: iconColor } : undefined} />
            </div>

            <div className="mt-2">
                <span className="font-sans text-[1.8rem] font-bold text-primary tracking-tight">
                    {displayValue}
                </span>
                {unit && <span className="font-mono text-[11px] text-muted ml-1">{unit}</span>}
            </div>

            {delta && (
                <div className="mt-1 font-mono text-[11px]">
                    {deltaPositive === true ? (
                        <span className="text-green">↑ {delta}</span>
                    ) : deltaPositive === false ? (
                        <span className="text-red">↓ {delta}</span>
                    ) : (
                        <span className="text-muted">→ {delta}</span>
                    )}
                </div>
            )}
        </div>
    )
}
