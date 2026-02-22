'use client'

import React from 'react'
import { TOP_ALERTS } from '@/lib/mockData'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function TopAlerts() {
    const router = useRouter()

    const getSeverityIcon = (sev: string) => {
        switch (sev) {
            case 'critical':
                return (
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-red/15 text-red shrink-0">
                        <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                )
            case 'high':
                return (
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-amber/15 text-amber shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                )
            case 'medium':
                return (
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-accent/15 text-accent shrink-0">
                        <Info className="w-3.5 h-3.5" />
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="bg-surface border border-dim rounded-xl overflow-hidden h-fit flex flex-col">
            <div className="px-5 py-4 border-b border-dim flex items-center justify-between">
                <h3 className="font-sans text-sm font-semibold text-primary">Needs Attention</h3>
                <div className="bg-red/10 border border-red/20 text-red rounded-full px-2.5 py-0.5 font-mono text-[11px]">
                    5 alerts
                </div>
            </div>

            <div className="flex flex-col">
                {TOP_ALERTS.map((alert) => (
                    <div
                        key={alert.id}
                        onClick={() => router.push(alert.route)}
                        className="px-5 py-3.5 border-b border-dim last:border-0 hover:bg-elevated cursor-pointer transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start">
                                {getSeverityIcon(alert.severity)}
                                <span className="font-mono text-[12px] text-primary font-medium ml-2.5 leading-snug">
                                    {alert.title}
                                </span>
                            </div>
                            <span className={`font-mono text-[10px] uppercase font-bold text-${alert.severity === 'critical' ? 'red' : alert.severity === 'high' ? 'amber' : 'accent'}`}>
                                {alert.severity}
                            </span>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                            <p className="font-mono text-[11px] text-secondary ml-8 leading-snug">
                                {alert.detail}
                            </p>
                            <span className="font-mono text-[11px] text-accent shrink-0 group-hover:underline">
                                → Fix
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
