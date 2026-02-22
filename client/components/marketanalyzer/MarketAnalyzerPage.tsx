'use client'

import React, { Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useMarketAnalyzer } from '@/hooks/useMarketAnalyzer'
import { MarketAnalyzerHeader } from './MarketAnalyzerHeader'
import { DetectedServicesPanel } from './DetectedServicesPanel'
import { CostOptimizationControls } from './CostOptimizationControls'
import { SuggestionsResults } from './SuggestionsResults'

function MarketAnalyzerContent() {
    const ma = useMarketAnalyzer()

    return (
        <div className="min-h-[calc(100vh-56px)] bg-base flex flex-col relative w-full">
            <MarketAnalyzerHeader
                totalCurrentSpend={ma.totalCurrentSpend}
                totalOptimizedSpend={ma.totalOptimizedSpend}
                overallSavingsPercent={ma.overallSavingsPercent}
                servicesCount={ma.detectedServices.length}
                isAnalyzing={ma.state === 'analyzing'}
                isComplete={ma.state === 'complete'}
                onAnalyze={ma.triggerAnalysis}
            />

            <AnimatePresence>
                {ma.visibleServiceIds.length > 0 && (
                    <DetectedServicesPanel
                        services={ma.detectedServices}
                        visibleIds={ma.visibleServiceIds}
                        isComplete={ma.state === 'complete'}
                    />
                )}
            </AnimatePresence>

            {ma.state === 'complete' && (
                <CostOptimizationControls
                    costCutPercent={ma.costCutPercent}
                    onCostCutChange={ma.setCostCutPercent}
                    targetService={ma.targetService}
                    onTargetServiceChange={ma.setTargetService}
                    services={ma.detectedServices}
                    totalCurrentSpend={ma.totalCurrentSpend}
                    totalOptimizedSpend={ma.totalOptimizedSpend}
                    overallSavingsPercent={ma.overallSavingsPercent}
                    isComplete={true}
                />
            )}

            <div className="flex-1 overflow-x-hidden">
                <SuggestionsResults
                    state={ma.state}
                    suggestions={ma.sortedSuggestions}
                    costCutPercent={ma.costCutPercent}
                    scanProgress={ma.scanProgress}
                />
            </div>
        </div>
    )
}

export function MarketAnalyzerPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-[calc(100vh-56px)] bg-base w-full flex items-center justify-center font-mono text-sm text-muted">
                    Loading...
                </div>
            }
        >
            <MarketAnalyzerContent />
        </Suspense>
    )
}