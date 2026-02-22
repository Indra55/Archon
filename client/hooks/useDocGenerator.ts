import { useState, useCallback, useMemo } from 'react'

export type ReviewMode = 'full' | 'hunk'
export type HunkDecision = 'accepted' | 'rejected' | 'pending'

export interface Hunk {
  id: number
  startLine: number
  endLine: number
  decision: HunkDecision
}

export type TemplateId = 'api' | 'adr' | 'runbook' | 'postmortem'

export interface DocItem {
  id: string
  serviceId: string
  name: string
  health: 'fresh' | 'stale' | 'missing'
  daysSinceUpdate: number | null
  template: TemplateId
}

export interface DocGeneratorHook {
  // Selection
  selectedDocId: string | null
  selectDoc: (id: string) => void
  selectedDoc: DocItem | null

  // Template
  selectedTemplate: TemplateId
  setTemplate: (t: TemplateId) => void

  // Review mode
  reviewMode: ReviewMode
  enterHunkMode: () => void
  exitHunkMode: () => void

  // Hunk state
  hunks: Hunk[]
  currentHunkIndex: number
  acceptHunk: () => void
  rejectHunk: () => void
  acceptAll: () => void
  rejectAll: () => void
  goToHunk: (index: number) => void

  // Computed
  acceptedCount: number
  totalHunkCount: number
  allResolved: boolean

  // Context sidebar
  isSidebarOpen: boolean
  toggleSidebar: () => void

  // File tree
  isTreeCollapsed: boolean
  toggleTree: () => void
  expandedServices: string[]
  toggleServiceExpand: (serviceId: string) => void
}

import { DOC_TREE, HUNKS } from '@/data/docGeneratorMockData'

export function useDocGenerator(): DocGeneratorHook {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('api')
  const [reviewMode, setReviewMode] = useState<ReviewMode>('full')

  // Create state for hunks when a doc is selected
  const [hunks, setHunks] = useState<Hunk[]>([])
  const [currentHunkIndex, setCurrentHunkIndex] = useState(0)

  // Sidebar and tree state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isTreeCollapsed, setIsTreeCollapsed] = useState(false)
  const [expandedServices, setExpandedServices] = useState<string[]>(DOC_TREE.map(s => s.serviceId))

  const selectedDoc = useMemo(() => {
    return DOC_TREE.flatMap(s =>
      s.docs.map(doc => ({ ...doc, serviceId: s.serviceId } as DocItem))
    ).find(d => d.id === selectedDocId) ?? null
  }, [selectedDocId])

  const selectDoc = useCallback((id: string) => {
    setSelectedDocId(id)
    setReviewMode('full')
    setCurrentHunkIndex(0)

    // Reset or initialize hunks for the new doc
    const initialHunks = HUNKS[id]?.map(h => ({
      ...h,
      decision: 'pending' as HunkDecision
    })) || []
    setHunks(initialHunks)
  }, [])

  const enterHunkMode = useCallback(() => setReviewMode('hunk'), [])
  const exitHunkMode = useCallback(() => setReviewMode('full'), [])

  const acceptHunk = useCallback(() => {
    if (hunks.length === 0) return
    setHunks(prev => {
      const newHunks = [...prev]
      if (newHunks[currentHunkIndex]) {
        newHunks[currentHunkIndex].decision = 'accepted'
      }
      return newHunks
    })

    if (currentHunkIndex < hunks.length - 1) {
      setCurrentHunkIndex(prev => prev + 1)
    } else {
      setReviewMode('full')
    }
  }, [currentHunkIndex, hunks.length])

  const rejectHunk = useCallback(() => {
    if (hunks.length === 0) return
    setHunks(prev => {
      const newHunks = [...prev]
      if (newHunks[currentHunkIndex]) {
        newHunks[currentHunkIndex].decision = 'rejected'
      }
      return newHunks
    })

    if (currentHunkIndex < hunks.length - 1) {
      setCurrentHunkIndex(prev => prev + 1)
    } else {
      setReviewMode('full')
    }
  }, [currentHunkIndex, hunks.length])

  const acceptAll = useCallback(() => {
    setHunks(prev => prev.map(h => ({ ...h, decision: 'accepted' })))
  }, [])

  const rejectAll = useCallback(() => {
    setHunks(prev => prev.map(h => ({ ...h, decision: 'rejected' })))
  }, [])

  const goToHunk = useCallback((index: number) => {
    setCurrentHunkIndex(Math.max(0, Math.min(index, hunks.length - 1)))
  }, [hunks.length])

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), [])
  const toggleTree = useCallback(() => setIsTreeCollapsed(prev => !prev), [])

  const toggleServiceExpand = useCallback((serviceId: string) => {
    setExpandedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }, [])

  const acceptedCount = hunks.filter(h => h.decision === 'accepted').length
  const totalHunkCount = hunks.length
  const allResolved = totalHunkCount > 0 && hunks.every(h => h.decision !== 'pending')

  return {
    selectedDocId,
    selectDoc,
    selectedDoc,
    selectedTemplate,
    setTemplate: setSelectedTemplate,
    reviewMode,
    enterHunkMode,
    exitHunkMode,
    hunks,
    currentHunkIndex,
    acceptHunk,
    rejectHunk,
    acceptAll,
    rejectAll,
    goToHunk,
    acceptedCount,
    totalHunkCount,
    allResolved,
    isSidebarOpen,
    toggleSidebar,
    isTreeCollapsed,
    toggleTree,
    expandedServices,
    toggleServiceExpand
  }
}
