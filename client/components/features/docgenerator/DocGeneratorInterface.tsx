'use client'

import { Suspense, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useDocGenerator } from '@/hooks/useDocGenerator'
import { TopControlBar } from './TopControlBar'
import { DocFileTree } from './DocFileTree'
import { DiffEditorPane } from './DiffEditorPane'
import { ContextSidebar } from './ContextSidebar'
import { DocGeneratorLanding } from './DocGeneratorLanding'

function DocGeneratorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const serviceParam = searchParams.get('service')
  const templateParam = searchParams.get('template')

  const {
    state,
    services,
    alerts,
    selectedService,
    selectedFile,
    selectService,
    selectFile,
    goBack,
    goToLanding,
    acceptHunk,
    rejectHunk,
    acceptAll,
    rejectAll,
    updateFileContent,
  } = useDocGenerator(serviceParam, templateParam)

  const selectServiceWithUrl = useCallback(
    (service: { slug: string }) => {
      selectService(services.find((s) => s.slug === service.slug) ?? service as any)
      const params = new URLSearchParams()
      params.set('service', service.slug)
      if (templateParam) params.set('template', templateParam)
      router.replace(`/dashboard/doc-generator?${params.toString()}`)
    },
    [router, templateParam, selectService, services]
  )

  const handleRegenerate = useCallback(() => {
    // Mock regenerate - in real app would call API
  }, [])

  const handleSave = useCallback(() => {
    // Mock save - in real app would persist
  }, [])

  const goBackWithUrl = useCallback(() => {
    goBack()
    if (state.view === 'editing') {
      router.replace('/dashboard/doc-generator?service=' + (selectedService?.slug ?? ''))
    } else if (state.view === 'browsing') {
      router.replace('/dashboard/doc-generator')
    }
  }, [goBack, state.view, selectedService?.slug, router])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        goBackWithUrl()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goBackWithUrl])

  if (state.view === 'landing') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full min-h-[calc(100vh-56px)] bg-base"
      >
        <DocGeneratorLanding
          services={services}
          alerts={alerts}
          onSelectService={selectServiceWithUrl}
          onAlertAction={(serviceId) => {
            const svc = services.find((s) => s.id === serviceId)
            if (svc) selectServiceWithUrl(svc)
          }}
        />
      </motion.div>
    )
  }

  const title =
    state.view === 'editing' && selectedFile
      ? selectedFile.label
      : selectedService?.name ?? 'Doc Generator'
  const subtitle =
    state.view === 'editing' && selectedService
      ? `${selectedService.name} · ${selectedFile?.path ?? ''}`
      : selectedService?.lastUpdated

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-56px)] bg-base"
    >
      <TopControlBar
        view={state.view}
        title={title}
        subtitle={subtitle}
        onBack={goBackWithUrl}
        onRegenerate={state.view === 'editing' ? handleRegenerate : undefined}
        onSave={state.view === 'editing' ? handleSave : undefined}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: File tree */}
        <div className="w-[220px] shrink-0 border-r border-dim bg-surface/30 overflow-y-auto">
          {selectedService && (
            <DocFileTree
              files={selectedService.docFiles}
              selectedFileId={selectedFile?.id ?? null}
              onSelectFile={selectFile}
            />
          )}
        </div>

        {/* Center: Diff editor */}
        <div className="flex-1 min-w-0 flex flex-col p-4 overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div
                key={selectedFile.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <DiffEditorPane
                  original={selectedFile.originalContent}
                  modified={selectedFile.generatedContent}
                  language="markdown"
                  onModifiedChange={(c) => updateFileContent(selectedFile.id, c)}
                />
                <p className="font-mono text-[10px] text-muted mt-2">
                  Left: current • Right: AI-generated • Press Esc to go back
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex items-center justify-center text-muted"
              >
                <p className="font-mono text-sm">
                  Select a doc file to view the diff
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Context sidebar */}
        {selectedService && (
          <ContextSidebar
            service={selectedService}
            file={selectedFile ?? null}
            alerts={alerts}
            onAcceptHunk={acceptHunk}
            onRejectHunk={rejectHunk}
            onAcceptAll={acceptAll}
            onRejectAll={rejectAll}
            onAlertAction={(serviceId) => {
              const svc = services.find((s) => s.id === serviceId)
              if (svc) selectServiceWithUrl(svc)
            }}
          />
        )}
      </div>
    </motion.div>
  )
}

export function DocGeneratorInterface() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      }
    >
      <DocGeneratorContent />
    </Suspense>
  )
}
