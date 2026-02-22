'use client'

import React, { useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
interface ComplexityMeterProps {
    value: number // 0 - 100
    explanation?: string
    animate?: boolean
}

export function ComplexityMeter({ value, explanation, animate = true }: ComplexityMeterProps) {

    const x = useMotionValue(0)
    const springX = useSpring(x, { stiffness: 60, damping: 20 })

    useEffect(() => {
        if (animate) {
            x.set((value / 100) * 400)
        } else {
            x.set((value / 100) * 400) // Instantly set
        }
    }, [value, animate, x])

    return (
        <div id="complexity" className="px-6 pb-6 scroll-mt-20">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-sans font-semibold text-primary">Migration Complexity</h3>
                <div className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                    value >= 75 ? 'bg-red/10 text-red border border-red/20' :
                    value >= 50 ? 'bg-amber/10 text-amber border border-amber/20' :
                    value >= 25 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                    'bg-green/10 text-green border border-green/20'
                }`}>
                    {value >= 75 ? 'CRITICAL' : value >= 50 ? 'HIGH' : value >= 25 ? 'MEDIUM' : 'LOW'}

                </div>
            </div>

            <div className="w-full h-[56px] bg-elevated border border-dim rounded-xl overflow-hidden relative">
                <svg viewBox="0 0 400 56" preserveAspectRatio="none" className="w-full h-full">
                    {/* Zones */}
                    <rect x="0" y="0" width="120" height="56" fill="rgba(16,185,129,0.15)" />
                    <rect x="120" y="0" width="140" height="56" fill="rgba(245,158,11,0.15)" />
                    <rect x="260" y="0" width="140" height="56" fill="rgba(239,68,68,0.15)" />

                    {/* Separators */}
                    <line x1="120" y1="0" x2="120" y2="56" stroke="var(--color-border-dim, #262633)" strokeWidth="1" />
                    <line x1="260" y1="0" x2="260" y2="56" stroke="var(--color-border-dim, #262633)" strokeWidth="1" />

                    {/* Labels */}
                    <text x="60" y="42" fill="var(--color-green, #10B981)" fontSize="10px" fontFamily="'IBM Plex Mono', monospace" textAnchor="middle">SIMPLE</text>
                    <text x="190" y="42" fill="var(--color-amber, #F59E0B)" fontSize="10px" fontFamily="'IBM Plex Mono', monospace" textAnchor="middle">MODERATE</text>
                    <text x="330" y="42" fill="var(--color-red, #EF4444)" fontSize="10px" fontFamily="'IBM Plex Mono', monospace" textAnchor="middle">COMPLEX</text>

                    {/* Needle Layer */}
                    <motion.g style={{ x: springX }}>
                        <line x1="0" y1="4" x2="0" y2="34" stroke="white" strokeWidth="2" />
                        <circle cx="0" cy="4" r="3" fill="white" />
                    </motion.g>
                </svg>
            </div>

            <p className="font-mono text-sm text-secondary leading-relaxed mt-4">
                {explanation || 'Complexity analysis pending...'}

            </p>
        </div>
    )
}
