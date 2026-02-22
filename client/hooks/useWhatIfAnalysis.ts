import { useState, useEffect } from 'react'


export type AnalysisState = 'idle' | 'analyzing' | 'complete' | 'refining'

export type SectionId =
    | 'impact-graph'
    | 'directly-broken'
    | 'transitively-affected'
    | 'api-clients'
    | 'schema-changes'
    | 'complexity'
    | 'mitigation'

export interface FollowUpExchange {
    question: string
    answer: string
    timestamp: string
}

export function useWhatIfAnalysis() {
    const [state, setState] = useState<AnalysisState>('idle')
    const [scenario, setScenario] = useState('')
    const [visibleSections, setVisibleSections] = useState<SectionId[]>([])
    const [activeSectionId, setActiveSectionId] = useState<SectionId | null>(null)
    const [followUps, setFollowUps] = useState<FollowUpExchange[]>([])
    const [checklistState, setChecklistState] = useState<Record<number, boolean>>({})
    const [report, setReport] = useState<any>(null)
    const [impactGraph, setImpactGraph] = useState<any>(null)
    const [suggestedScenarios, setSuggestedScenarios] = useState<string[]>([])

    useEffect(() => {
        // Fetch suggested scenarios on mount
        const apiUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5555';
        fetch(`${apiUrl}/knowledge/impact/scenarios`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setSuggestedScenarios(data)
            })
            .catch(err => console.error("Failed to fetch scenarios:", err))
    }, [])


    const scheduleReveals = () => {
        setVisibleSections([])

        const sequence: { id: SectionId; delay: number }[] = [
            { id: 'impact-graph', delay: 600 },
            { id: 'directly-broken', delay: 1200 },
            { id: 'transitively-affected', delay: 1800 },
            { id: 'api-clients', delay: 2400 },
            { id: 'schema-changes', delay: 2800 },
            { id: 'complexity', delay: 3200 },
            { id: 'mitigation', delay: 3600 },

        ]

        sequence.forEach(({ id, delay }) => {
            setTimeout(() => setVisibleSections((prev) => [...prev, id]), delay)
        })

        setTimeout(() => setState('complete'), 3600 + 400)
    }

    const submitWithScenario = async (scenarioText: string) => {
        if (!scenarioText.trim()) return
        setState('analyzing')

        try {
            const apiUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5555';
            const response = await fetch(`${apiUrl}/knowledge/impact/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario: scenarioText })
            })
            const responseText = await response.text()
            console.log("[WhatIf Frontend] Raw response text:", responseText)

            let data;
            try {
                data = JSON.parse(responseText)
            } catch (err) {
                console.error("[WhatIf Frontend] JSON parse error:", err)
                setState('idle')
                return
            }

            if (data.error) {
                console.error("Analysis failed:", data.error)
                setState('idle')
                return
            }

            setReport(data.report)
            setImpactGraph(data.graph)
            scheduleReveals()
        } catch (error) {
            console.error("Error during analysis:", error)
            setState('idle')
        }
    }

    const submit = async () => {
        await submitWithScenario(scenario)
    }

    const refine = async (constraint: string) => {
        const newScenario = `${scenario}\n\nConstraint: ${constraint}`
        setScenario(newScenario)
        setState('refining')
        setChecklistState({})
        setFollowUps([])
        await submitWithScenario(newScenario)
    }

    const submitFollowUp = async (question: string) => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        // Add optimistic loading entry
        const loadingExchange: FollowUpExchange = { question, answer: '...', timestamp }
        setFollowUps((prev) => [...prev, loadingExchange])

        try {
            const apiUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5555';
            const response = await fetch(`${apiUrl}/knowledge/impact/followup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, report, scenario })
            })
            const data = await response.json()
            const answer = data.answer || 'Sorry, I could not generate an answer for that question.'

            // Replace loading entry with real answer
            setFollowUps((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = { question, answer, timestamp }
                return updated
            })
        } catch (error) {
            console.error("Follow-up failed:", error)
            setFollowUps((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = { question, answer: 'Failed to get a response. Please try again.', timestamp }
                return updated
            })
        }

    }

    const toggleChecklistItem = (id: number) => {
        setChecklistState((prev) => ({ ...prev, [id]: !prev[id] }))
    }

    // Compute live quick stats from the new report format
    const quickStats = {
        directlyBroken: report?.summary?.directly_broken_count ?? report?.impact_analysis?.directly_broken_services?.length ?? 0,
        transitivelyAffected: report?.summary?.transitively_affected_count ?? report?.impact_analysis?.transitively_affected?.length ?? 0,
        affectedClients: report?.summary?.affected_api_clients_count ?? report?.impact_analysis?.affected_api_clients?.length ?? 0,
        riskLevel: report?.summary?.risk_level || 'MEDIUM',
    }

    // Derive complexity score from migration_complexity
    const complexityMap: Record<string, number> = { 'SIMPLE': 25, 'MODERATE': 55, 'COMPLEX': 85 }
    const complexityScore = complexityMap[report?.summary?.migration_complexity] ?? 50

    // Compute live section metadata from report
    const sectionMeta: Record<string, { count?: number | string; badge?: string }> = {
        'directly-broken': { count: quickStats.directlyBroken },
        'transitively-affected': { count: quickStats.transitivelyAffected },
        'api-clients': { count: quickStats.affectedClients },
        'schema-changes': { count: report?.schema_changes_required?.after?.length || 0 },
        'complexity': { badge: report?.summary?.migration_complexity || 'MODERATE' },
        'mitigation': { count: report?.suggested_mitigation_steps?.length || 0 },
    }

    return {
        state,
        scenario,
        setScenario,
        submit,
        refine,
        submitFollowUp,
        visibleSections,
        activeSectionId,
        setActiveSectionId,
        followUps,
        checklistState,
        toggleChecklistItem,
        report,
        impactGraph,
        suggestedScenarios,
        quickStats,
        sectionMeta,
        complexityScore,

    }
}
