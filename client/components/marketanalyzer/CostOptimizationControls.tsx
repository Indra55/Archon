'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'
import { type DetectedService } from '@/data/marketAnalyzerMockData'

interface CostOptimizationControlsProps {
    costCutPercent: number
    onCostCutChange: (val: number) => void
    targetService: string
    onTargetServiceChange: (val: string) => void
    services: DetectedService[]
    totalCurrentSpend: number
    totalOptimizedSpend: number
    overallSavingsPercent: number
    isComplete: boolean
}

export function CostOptimizationControls({
    costCutPercent,
    onCostCutChange,
    targetService,
    onTargetServiceChange,
    services,
    totalCurrentSpend,
    totalOptimizedSpend,
    overallSavingsPercent,
    isComplete,
}: CostOptimizationControlsProps) {
    // Determine thumb color based on value
    const getSliderColor = () => {
        if (costCutPercent <= 25) return 'from-emerald-500 to-emerald-400'
        if (costCutPercent <= 50) return 'from-amber-500 to-amber-400'
        return 'from-red-500 to-red-400'
    }

    const getThumbLabel = () => {
        if (costCutPercent === 0) return 'No target'
        if (costCutPercent <= 25) return 'Conservative'
        if (costCutPercent <= 50) return 'Moderate'
        return 'Aggressive'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="px-8 py-5 border-b border-dim bg-surface/30"
        >
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                {/* Cost Cut Slider */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                        <SlidersHorizontal size={14} className="text-accent" />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                            Cost Reduction Target
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            {/* Custom styled range slider */}
                            <style>{`
                                .market-slider {
                                    -webkit-appearance: none;
                                    appearance: none;
                                    width: 100%;
                                    height: 8px;
                                    border-radius: 9999px;
                                    outline: none;
                                    cursor: pointer;
                                    background: linear-gradient(
                                        to right,
                                        ${costCutPercent <= 25 ? '#10B981' : costCutPercent <= 50 ? '#F59E0B' : '#EF4444'} 0%,
                                        ${costCutPercent <= 25 ? '#34D399' : costCutPercent <= 50 ? '#FBBF24' : '#F87171'} ${(costCutPercent / 80) * 100}%,
                                        #1A1A22 ${(costCutPercent / 80) * 100}%,
                                        #1A1A22 100%
                                    );
                                    transition: background 0.15s ease;
                                }
                                .market-slider::-webkit-slider-thumb {
                                    -webkit-appearance: none;
                                    appearance: none;
                                    width: 22px;
                                    height: 22px;
                                    border-radius: 50%;
                                    background: ${costCutPercent <= 25 ? '#10B981' : costCutPercent <= 50 ? '#F59E0B' : '#EF4444'};
                                    border: 3px solid #09090E;
                                    box-shadow: 0 0 0 3px ${costCutPercent <= 25 ? 'rgba(16,185,129,0.3)' : costCutPercent <= 50 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}, 0 2px 6px rgba(0,0,0,0.4);
                                    cursor: grab;
                                    transition: box-shadow 0.2s ease, transform 0.15s ease;
                                }
                                .market-slider::-webkit-slider-thumb:hover {
                                    transform: scale(1.15);
                                    box-shadow: 0 0 0 5px ${costCutPercent <= 25 ? 'rgba(16,185,129,0.4)' : costCutPercent <= 50 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'}, 0 2px 8px rgba(0,0,0,0.5);
                                }
                                .market-slider::-webkit-slider-thumb:active {
                                    cursor: grabbing;
                                    transform: scale(1.05);
                                }
                                .market-slider::-moz-range-thumb {
                                    width: 22px;
                                    height: 22px;
                                    border-radius: 50%;
                                    background: ${costCutPercent <= 25 ? '#10B981' : costCutPercent <= 50 ? '#F59E0B' : '#EF4444'};
                                    border: 3px solid #09090E;
                                    box-shadow: 0 0 0 3px ${costCutPercent <= 25 ? 'rgba(16,185,129,0.3)' : costCutPercent <= 50 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}, 0 2px 6px rgba(0,0,0,0.4);
                                    cursor: grab;
                                    transition: box-shadow 0.2s ease, transform 0.15s ease;
                                }
                                .market-slider::-moz-range-thumb:hover {
                                    transform: scale(1.15);
                                }
                                .market-slider::-moz-range-track {
                                    height: 8px;
                                    border-radius: 9999px;
                                    background: transparent;
                                }
                            `}</style>
                            <input
                                type="range"
                                min={0}
                                max={80}
                                step={5}
                                value={costCutPercent}
                                onChange={(e) => onCostCutChange(Number(e.target.value))}
                                className="market-slider w-full"
                            />
                            {/* Tick marks */}
                            <div className="flex justify-between mt-2 px-0.5">
                                {[0, 20, 40, 60, 80].map(v => (
                                    <span
                                        key={v}
                                        className={`font-mono text-[9px] transition-colors duration-200 ${v <= costCutPercent ? 'text-secondary' : 'text-muted/50'
                                            }`}
                                    >
                                        {v}%
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Value badge */}
                        <div className="flex flex-col items-center shrink-0 ml-2">
                            <span className={`font-['Syne'] text-2xl font-bold ${costCutPercent <= 25 ? 'text-emerald-400' :
                                costCutPercent <= 50 ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                {costCutPercent}%
                            </span>
                            <span className="font-mono text-[9px] text-muted uppercase tracking-wider">
                                {getThumbLabel()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="hidden lg:block h-12 w-px bg-dim" />

                {/* Service Dropdown */}
                <div className="shrink-0 min-w-[240px]">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                            Filter Service
                        </span>
                    </div>
                    <div className="relative">
                        <select
                            value={targetService}
                            onChange={(e) => onTargetServiceChange(e.target.value)}
                            className="w-full appearance-none bg-elevated border border-dim rounded-lg px-3 py-2.5 pr-8 font-mono text-xs text-secondary focus:border-accent focus:outline-none transition-colors cursor-pointer hover:border-accent/40"
                        >
                            <option value="all">All Services</option>
                            {services.map(svc => (
                                <option key={svc.id} value={svc.id}>
                                    {svc.name} — ${svc.currentMonthlyCost}/mo
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    </div>
                </div>

                {/* Quick stats */}
                {isComplete && (
                    <>
                        <div className="hidden lg:block h-12 w-px bg-dim" />
                        <div className="flex items-center gap-4 shrink-0">
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="font-mono text-xs text-muted">Current</span>
                                <span className="font-['Syne'] text-base font-bold text-primary">
                                    ${totalCurrentSpend.toLocaleString()}
                                </span>
                            </div>
                            <span className="font-mono text-lg text-muted">→</span>
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="font-mono text-xs text-muted">Optimized</span>
                                <span className="font-['Syne'] text-base font-bold text-emerald-400">
                                    ${totalOptimizedSpend.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    )
}