import { useState, useMemo, useCallback } from 'react'
import {
    DETECTED_SERVICES,
    SUGGESTIONS_MAP,
    type DetectedService,
    type ServiceSuggestion,
} from '@/data/marketAnalyzerMockData'

export type AnalyzerState = 'idle' | 'analyzing' | 'complete'

export function useMarketAnalyzer() {
    const [state, setState] = useState<AnalyzerState>('idle')
    const [costCutPercent, setCostCutPercent] = useState(0)
    const [targetService, setTargetService] = useState<string>('all')
    const [scanProgress, setScanProgress] = useState(0)
    const [visibleServiceIds, setVisibleServiceIds] = useState<string[]>([])

    // ── Computed: filtered suggestions ──
    const filteredSuggestions = useMemo<ServiceSuggestion[]>(() => {
        const allSuggestions = Object.values(SUGGESTIONS_MAP)
        if (targetService === 'all') return allSuggestions
        return allSuggestions.filter(s => s.service.id === targetService)
    }, [targetService])

    // ── Computed: sort alternatives within each suggestion by savings proximity to target ── client/components/docgenerator/DiffEditorPane.tsx
    const sortedSuggestions = useMemo<ServiceSuggestion[]>(() => {
        return filteredSuggestions.map(suggestion => ({
            ...suggestion,
            alternatives: [...suggestion.alternatives].sort((a, b) => {
                if (costCutPercent === 0) return b.savingsPercent - a.savingsPercent
                const aDist = Math.abs(a.savingsPercent - costCutPercent)
                const bDist = Math.abs(b.savingsPercent - costCutPercent)
                return aDist - bDist
            }),
        }))
    }, [filteredSuggestions, costCutPercent])

    // ── Computed: spend totals ──
    const totalCurrentSpend = useMemo(
        () => DETECTED_SERVICES.reduce((sum, s) => sum + s.currentMonthlyCost, 0),
        [],
    )

    const totalOptimizedSpend = useMemo(() => {
        let optimized = 0
        for (const svc of DETECTED_SERVICES) {
            const suggestion = SUGGESTIONS_MAP[svc.id]
            if (suggestion && suggestion.alternatives.length > 0) {
                const bestAlt = suggestion.alternatives.reduce(
                    (best, alt) => (alt.estimatedMonthlyCost < best.estimatedMonthlyCost ? alt : best),
                    suggestion.alternatives[0],
                )
                optimized += bestAlt.estimatedMonthlyCost
            } else {
                optimized += svc.currentMonthlyCost
            }
        }
        return optimized
    }, [])

    const overallSavingsPercent = useMemo(
        () =>
            totalCurrentSpend > 0
                ? Math.round(((totalCurrentSpend - totalOptimizedSpend) / totalCurrentSpend) * 100)
                : 0,
        [totalCurrentSpend, totalOptimizedSpend],
    )

    // ── Trigger analysis with simulated scan ──
    const triggerAnalysis = useCallback(() => {
        setState('analyzing')
        setScanProgress(0)
        setVisibleServiceIds([])

        const totalMs = 2400
        const steps = 24
        const stepMs = totalMs / steps

        let currentStep = 0
        const interval = setInterval(() => {
            currentStep++
            setScanProgress(Math.round((currentStep / steps) * 100))

            // Reveal services gradually
            const serviceIndex = Math.floor((currentStep / steps) * DETECTED_SERVICES.length)
            setVisibleServiceIds(
                DETECTED_SERVICES.slice(0, serviceIndex + 1).map(s => s.id),
            )

            if (currentStep >= steps) {
                clearInterval(interval)
                setVisibleServiceIds(DETECTED_SERVICES.map(s => s.id))
                setState('complete')
            }
        }, stepMs)
    }, [])

    return {
        state,
        costCutPercent,
        setCostCutPercent,
        targetService,
        setTargetService,
        scanProgress,
        visibleServiceIds,
        detectedServices: DETECTED_SERVICES,
        sortedSuggestions,
        totalCurrentSpend,
        totalOptimizedSpend,
        overallSavingsPercent,
        triggerAnalysis,
    }
}