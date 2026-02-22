import React, { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DiffEditor, useMonaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { Info, X, FileEdit, AlertTriangle, FileX, GitPullRequest, Loader2, Sparkles, CheckCircle } from 'lucide-react'
import type { DocItem, ReviewMode, Hunk } from '@/hooks/useDocGenerator'
import { DOC_CONTENT, FALLBACK_DIFF, HUNKS } from '@/data/docGeneratorMockData'
import { HunkReviewer } from './HunkReviewer'

interface DiffEditorPaneProps {
  doc: DocItem | null
  reviewMode: ReviewMode
  hunks: Hunk[]
  currentHunkIndex: number
  onAcceptHunk: () => void
  onRejectHunk: () => void
  onSkipHunk: () => void
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  allResolved: boolean
  onSelectDoc: (id: string) => void
  totalHunkCount: number
}

export function DiffEditorPane({
  doc,
  reviewMode,
  hunks,
  currentHunkIndex,
  onAcceptHunk,
  onRejectHunk,
  onSkipHunk,
  isSidebarOpen,
  onToggleSidebar,
  allResolved,
  onSelectDoc,
  totalHunkCount
}: DiffEditorPaneProps) {
  const monaco = useMonaco()
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null)
  const decorationIds = useRef<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false)

  // Reset internal mock generation state on new doc
  useEffect(() => {
    setIsGenerating(false)
    setShowToast(false)
    setHasGeneratedContent(false)
  }, [doc?.id])

  const content = doc
    ? DOC_CONTENT[doc.id] || FALLBACK_DIFF
    : FALLBACK_DIFF

  const displayOriginal = doc?.health === 'missing' && !hasGeneratedContent
    ? ''
    : content.original.replace(/{docName}/g, doc?.name || '')

  const displayModified = doc?.health === 'missing' && !hasGeneratedContent
    ? ''
    : content.modified.replace(/{docName}/g, doc?.name || '')

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setHasGeneratedContent(true)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }, 1800)
  }

  const handleMount = (editor: editor.IStandaloneDiffEditor) => {
    editorRef.current = editor
  }

  // Handle highlighted row
  useEffect(() => {
    if (!editorRef.current || !monaco) return
    if (!doc || reviewMode !== 'hunk') {
      // Clear decorations
      const modifiedEditor = editorRef.current.getModifiedEditor()
      if (decorationIds.current.length > 0) {
        modifiedEditor.deltaDecorations(decorationIds.current, [])
        decorationIds.current = []
      }
      return
    }

    const modifiedEditor = editorRef.current.getModifiedEditor()
    const currentHunk = hunks[currentHunkIndex]

    if (currentHunk) {
      if (decorationIds.current.length > 0) {
        modifiedEditor.deltaDecorations(decorationIds.current, [])
      }

      decorationIds.current = modifiedEditor.deltaDecorations([], [
        {
          range: new monaco.Range(currentHunk.startLine, 1, currentHunk.endLine, 1),
          options: {
            isWholeLine: true,
            className: 'hunk-highlight',
            linesDecorationsClassName: 'hunk-gutter',
          }
        }
      ])

      modifiedEditor.revealLineInCenter(currentHunk.startLine)
    }
  }, [reviewMode, currentHunkIndex, hunks, doc, monaco])

  // Download export
  const handleExport = () => {
    if (!doc) return
    const blob = new Blob([displayModified], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.name.toLowerCase().replace(/ /g, '-')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!doc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0A] relative border-b border-[#2A2A2A]" style={{ height: '100%' }}>
        <FileEdit size={40} className="text-gray-500 mb-4" />
        <h2 className="font-['Syne'] text-base font-semibold text-gray-400">
          Select a document to review
        </h2>
        <p className="font-mono text-xs text-gray-500 mt-2 text-center max-w-[280px]">
          Choose any document from the file tree to see the AI-suggested updates.
        </p>

        <div className="flex gap-3 mt-6">
          <div
            onClick={() => onSelectDoc('auth-api')}
            className="bg-[#111] border border-[#2A2A2A] rounded-xl px-4 py-3 cursor-pointer hover:border-[#6366F1] transition-colors flex items-center gap-2"
          >
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="font-mono text-xs text-gray-400">Review stale docs (3)</span>
          </div>

          <div
            onClick={() => onSelectDoc('auth-runbook')}
            className="bg-[#111] border border-[#2A2A2A] rounded-xl px-4 py-3 cursor-pointer hover:border-[#6366F1] transition-colors flex items-center gap-2"
          >
            <FileX size={16} className="text-red-500" />
            <span className="font-mono text-xs text-gray-400">Create missing docs (2)</span>
          </div>

          <div
            onClick={() => onSelectDoc('payment-adr-002')}
            className="bg-[#111] border border-[#2A2A2A] rounded-xl px-4 py-3 cursor-pointer hover:border-[#6366F1] transition-colors flex items-center gap-2"
          >
            <GitPullRequest size={16} className="text-[#6366F1]" />
            <span className="font-mono text-xs text-gray-400">From CI violation</span>
          </div>
        </div>
      </div>
    )
  }

  const isMissingView = doc.health === 'missing' && !hasGeneratedContent

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A] relative border-b border-[#2A2A2A]">
      {/* PANE HEADER */}
      <div className="h-10 border-b border-[#2A2A2A] px-4 flex items-center gap-3 bg-[#111] z-10 flex-shrink-0">
        {!isMissingView && (
          <div className="flex items-center flex-1 h-full">
            <div className="flex-1 flex justify-center">
              <span className="font-mono text-xs text-gray-500 select-none">Current</span>
            </div>
            <div className="w-[1px] h-4 bg-[#2A2A2A] mx-4" />
            <div className="flex-1 flex justify-center">
              <span className="font-mono text-xs text-gray-500 select-none">AI Suggestion</span>
            </div>
          </div>
        )}

        <button
          onClick={onToggleSidebar}
          className="ml-auto flex items-center gap-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-2.5 py-1 font-mono text-xs text-gray-400 hover:border-[#6366F1] hover:text-gray-200 transition-colors"
        >
          {isSidebarOpen ? (
            <>
              <X size={12} />
              <span>Close</span>
            </>
          ) : (
            <>
              <Info size={12} />
              <span>Why? →</span>
            </>
          )}
        </button>
      </div>

      {allResolved && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-green-500/10 border-b border-green-500/20 px-6 py-3 flex items-center gap-3 flex-shrink-0 z-10"
        >
          <CheckCircle size={16} className="text-green-500" />
          <span className="font-mono text-sm text-green-500 font-medium">
            All {totalHunkCount} hunks resolved.
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => alert("Save & Commit flow coming soon")}
              className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg px-4 py-1.5 font-mono text-xs hover:bg-green-500/20 transition-colors"
            >
              Save & Commit
            </button>
            <button
              onClick={handleExport}
              className="font-mono text-xs text-gray-400 border border-[#2A2A2A] rounded-lg px-4 py-1.5 hover:bg-[#1A1A1A] transition-colors"
            >
              Export as Markdown
            </button>
          </div>
        </motion.div>
      )}

      {/* EDITOR OR MISSING VIEW */}
      <div className="flex-1 relative min-h-0 bg-[#1E1E1E]">
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2 font-mono text-sm shadow-xl"
            >
              <CheckCircle size={14} />
              <span>Document generated — review the suggestion below.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {isMissingView ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="bg-[#111] border border-dashed border-[#2A2A2A] rounded-2xl p-8 max-w-md w-full flex flex-col items-center">
              <FileX size={36} className="text-gray-500 mb-4" />
              <h2 className="font-['Syne'] text-lg font-semibold text-gray-100 text-center">
                {doc.name} doesn&apos;t exist yet.
              </h2>
              <p className="font-mono text-sm text-gray-400 mt-2 text-center max-w-[320px]">
                Click below to generate it using the AI based on your codebase and commit history.
              </p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="mt-6 flex items-center gap-2 bg-[#6366F1] text-white rounded-xl px-6 py-3 font-mono text-sm hover:bg-[#5558E6] transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={doc.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full w-full absolute inset-0"
            >
              <DiffEditor
                height="100%"
                language={content.language}
                original={displayOriginal}
                modified={displayModified}
                theme="vs-dark"
                onMount={handleMount}
                options={{
                  readOnly: reviewMode === 'hunk',
                  renderSideBySide: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  renderLineHighlight: 'line',
                  wordWrap: 'on',
                  diffWordWrap: 'on',
                  originalEditable: false,
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </motion.div>
          </AnimatePresence>
        )}

        <AnimatePresence>
          {reviewMode === 'hunk' && hunks.length > 0 && currentHunkIndex < hunks.length && (
            <HunkReviewer
              currentHunkIndex={currentHunkIndex}
              totalHunkCount={hunks.length}
              hunk={hunks[currentHunkIndex]}
              summary={HUNKS[doc.id]?.[currentHunkIndex]?.summary}
              onAccept={onAcceptHunk}
              onReject={onRejectHunk}
              onSkip={onSkipHunk}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
