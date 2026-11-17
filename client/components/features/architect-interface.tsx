'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'
import { ConversationThread } from './architect/conversation-thread'
import { LandingState } from './architect/landing-state'
import { PipelineProgress } from './architect/pipeline-progress'

export interface Exchange {
  id: string
  userMessage: string
  pipelineState?: Record<string, any>
  aiResponse: Array<{
    type: 'text' | 'diagram' | 'decision' | 'fileTree' | 'actions'
    data: any
  }>
}

type PipelineStage =
  | 'idle'
  | 'connecting'
  | 'analyze_requirements'
  | 'design_architecture'
  | 'generate_blueprint'
  | 'scaffold_infrastructure'
  | 'create_pr'
  | 'complete'
  | 'error'

interface StageData {
  [key: string]: any
}

const SUGGESTIONS = [
  'Food delivery app with real-time tracking',
  'Multi-tenant SaaS with billing',
  'Real-time collaboration tool',
  'Event-driven microservices platform',
]

function buildExchangeFromPipelineData(
  userMessage: string,
  stageData: Record<string, StageData>,
  pipelineState: Record<string, any> = {}
): Exchange {
  const aiResponse: Exchange['aiResponse'] = []

  // 1. Analysis summary
  const analysis = stageData['analyze_requirements']
  if (analysis) {
    const lines = []
    if (analysis.project_name) lines.push(`${analysis.project_name.toUpperCase()}`)
    if (analysis.project_summary) lines.push(`\n${analysis.project_summary}`)

    if (analysis.functional_requirements?.length > 0) {
      lines.push(`\nFUNCTIONAL REQUIREMENTS:`)
      analysis.functional_requirements.forEach((r: string) => lines.push(`• ${r}`))
    }
    if (analysis.non_functional_requirements?.length > 0) {
      lines.push(`\nNON-FUNCTIONAL REQUIREMENTS:`)
      analysis.non_functional_requirements.forEach((r: string) => lines.push(`• ${r}`))
    }
    if (analysis.constraints?.length > 0) {
      lines.push(`\nCONSTRAINTS:`)
      analysis.constraints.forEach((c: string) => lines.push(`• ${c}`))
    }
    if (analysis.target_scale) {
      lines.push(`\n**Target Scale:** ${analysis.target_scale}`)
    }

    aiResponse.push({ type: 'text', data: { content: lines.join('\n') } })
  }

  // 2. Architecture diagram
  const design = stageData['design_architecture']
  if (design) {
    if (design.architecture_style || design.tech_stack_rationale) {
      const lines = []
      if (design.architecture_style) {
        lines.push(`ARCHITECTURE STYLE: ${design.architecture_style}`)
      }
      if (design.tech_stack_rationale) {
        lines.push(`\n${design.tech_stack_rationale}`)
      }
      aiResponse.push({ type: 'text', data: { content: lines.join('\n') } })
    }

    if (design.services?.length > 0) {
      aiResponse.push({ type: 'diagram', data: { design, projectName: analysis?.project_name } })
    }

    if (design.decisions?.length > 0) {
      design.decisions.forEach((d: any) => {
        aiResponse.push({
          type: 'decision',
          data: {
            title: d.title || d.decision || 'Decision',
            category: d.category || d.area || 'Architecture',
            rationale: d.rationale || d.reasoning || '',
            alternatives: d.alternatives || d.rejected_alternatives || [],
          },
        })
      })
    }
  }

  // 3. Scaffold / file tree
  const scaffold = stageData['scaffold_infrastructure']
  if (scaffold && scaffold.files?.length > 0) {
    aiResponse.push({
      type: 'fileTree',
      data: {
        files: scaffold.files.map((f: any) => f.path || f),
        snippets: scaffold.files.map((f: any) => f.description || ''),
      },
    })
  }

  // 4. PR link
  const pr = stageData['create_pr']
  if (pr && pr.pr_url) {
    aiResponse.push({
      type: 'text',
      data: {
        content: `✅ Pull Request Created Successfully\n\nReview and merge the scaffold code here:\n${pr.pr_url}\n\nBranch: ${pr.branch_name || ''}\nFiles committed: ${pr.files_committed?.length || 0}`,
      },
    })
  }

  // 5. Actions
  aiResponse.push({ type: 'actions', data: { hasFiles: !!pipelineState.scaffolded_files?.length } })

  return {
    id: `exchange-${Date.now()}`,
    userMessage,
    pipelineState,
    aiResponse,
  }
}

export function ArchitectInterface() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')

  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [input, setInput] = useState('')
  const [modifying, setModifying] = useState<Exchange | null>(null)
  const lastRequest = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('idle')
  const [stageData, setStageData] = useState<Record<string, StageData>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentQuery, setCurrentQuery] = useState('')
  // Track if user has ever submitted — prevents flash back to landing
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [exchanges])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      submitQuery(input, modifying ? { architecture: modifying.pipelineState, modification: input } : {})
    }
  }

  const submitQuery = useCallback(async (query: string, options: any = {}) => {
    lastRequest.current = { query, options }
    setModifying(null)
    setIsLoading(true)
    setInput('')
    setErrorMessage(null)
    setPipelineStage('connecting')
    setStageData({})
    setCurrentQuery(query)
    setHasSubmitted(true)

    try {
      const response = await fetch('/api/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements: options.modification ? options.architecture?.user_requirements || query : query,
          ...options,
          ...(projectId && { projectId }),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Failed to connect to architecture agent',
        }))
        setErrorMessage(errorData.error || 'Agent returned an error')
        setPipelineStage('error')
        setIsLoading(false)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        setErrorMessage('No response stream received')
        setPipelineStage('error')
        setIsLoading(false)
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''
      const collectedStageData: Record<string, StageData> = options.action === 'scaffold' ? {
        analyze_requirements: options.architecture, design_architecture: options.architecture,
      } : {}
      let isCompletedLocally = false
      let failed = false

      const processSSELine = (line: string) => {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) return

        const jsonStr = trimmed.slice(5).trim()
        if (!jsonStr) return

        try {
          const eventData = JSON.parse(jsonStr)

          if (eventData.type === 'progress') {
            setPipelineStage(eventData.node as PipelineStage)
            if (eventData.data) {
              collectedStageData[eventData.node] = eventData.data
              // Create a new object ref so React detects the change
              setStageData({ ...collectedStageData })
            }
          } else if (eventData.type === 'error') {
            failed = true
            setErrorMessage(
              eventData.errors?.join(', ') || 'Pipeline error occurred'
            )
            setPipelineStage('error')
          } else if (eventData.type === 'complete') {
            isCompletedLocally = true
            setPipelineStage('complete')

            // Build the exchange from all collected data
            const exchange = buildExchangeFromPipelineData(query, collectedStageData, eventData.state || {})

            setExchanges((prev) => [...prev, exchange])
            setIsLoading(false)
          }
        } catch {
          // Skip malformed JSON
        }
      }

      // Read the stream
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE events are separated by double newlines
        const parts = buffer.split('\n\n')
        // Keep the last part in the buffer (might be incomplete)
        buffer = parts.pop() || ''

        for (const part of parts) {
          // Each SSE event can have multiple lines, process each
          const lines = part.split('\n')
          for (const line of lines) {
            processSSELine(line)
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const lines = buffer.split('\n')
        for (const line of lines) {
          processSSELine(line)
        }
      }

      if (!isCompletedLocally && !failed) {
        throw new Error('The architecture stream ended before completion. Please retry.')
      }
      setIsLoading(false)
    } catch (err) {
      console.error('Pipeline request failed:', err)
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to connect to agent'
      )
      setPipelineStage('error')
      setIsLoading(false)
    }
  }, [projectId])

  const handleAction = async (action: string, exchange: Exchange) => {
    if (isLoading) return
    const state = exchange.pipelineState || {}
    if (action === 'modify') {
      setModifying(exchange)
      setInput('')
      requestAnimationFrame(() => { inputRef.current?.focus(); inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) })
    } else if (action === 'scaffold' && !state.scaffolded_files?.length) {
      submitQuery(state.user_requirements || exchange.userMessage, { action: 'scaffold', architecture: state })
    } else {
      try {
        let blob: Blob
        let name: string
        if (action === 'export') {
          blob = new Blob([state.blueprint_markdown || JSON.stringify(state, null, 2)], { type: 'text/markdown' })
          name = 'BLUEPRINT.md'
        } else {
          const response = await fetch('/api/architect/archive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files: state.scaffolded_files, blueprint: state.blueprint_markdown }) })
          if (!response.ok) throw new Error((await response.json()).error || 'Download failed')
          blob = await response.blob()
          name = 'archon-scaffold.zip'
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url; link.download = name; link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Download failed'); setPipelineStage('error') }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'
  }

  // Show landing state ONLY when never submitted
  if (!hasSubmitted && exchanges.length === 0) {
    return (
      <LandingState
        suggestions={SUGGESTIONS}
        onSuggestionClick={submitQuery}
      />
    )
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Sticky Follow-up Input at Top */}
      <div className="sticky top-20 z-40 bg-background/95 backdrop-blur-md border-b border-muted-foreground/20 px-4 md:px-8 py-4 transition-all duration-300">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          {modifying && <div className="mb-3 flex items-center justify-between text-xs text-accent"><span>Modifying {modifying.pipelineState?.project_name || 'selected architecture'}</span><button type="button" onClick={() => setModifying(null)}>Cancel</button></div>}
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder={modifying ? 'Describe what to change in this architecture…' : 'Describe another architecture…'}
              className="flex-1 px-4 py-2 bg-card border border-muted-foreground/40 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-300 resize-none font-mono text-sm"
              rows={1}
              disabled={isLoading}
            />
            <button
              aria-label="Submit architecture request"
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-accent text-background rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Pipeline Progress (shown while loading) */}
      {isLoading && (
        <PipelineProgress
          stage={pipelineStage}
          action={lastRequest.current?.options?.action || 'design'}
          stageData={stageData}
          errorMessage={errorMessage}
          query={currentQuery}
        />
      )}

      {/* Error retry */}
      {pipelineStage === 'error' && !isLoading && errorMessage && (
        <div className="w-full px-4 md:px-8 py-6">
          <div className="max-w-xl mx-auto p-4 rounded-lg bg-destructive/10 border border-destructive/30 space-y-3">
            <p className="text-sm text-destructive font-mono">{errorMessage}</p>
            <button
              onClick={() => lastRequest.current && submitQuery(lastRequest.current.query, lastRequest.current.options)}
              className="px-4 py-2 rounded-md text-sm bg-accent text-background font-bold hover:bg-accent/90 transition-all font-mono"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Conversation Thread */}
      {exchanges.length > 0 && (
        <div ref={threadRef} className="flex-1 overflow-y-auto py-8">
          <div className="max-w-[1120px] mx-auto px-4 md:px-8">
            <ConversationThread exchanges={exchanges} onAction={handleAction} busy={isLoading} />
          </div>
        </div>
      )}
    </div>
  )
}
