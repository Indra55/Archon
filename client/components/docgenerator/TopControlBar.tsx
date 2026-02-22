import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Sparkles, Layers, X, CheckCheck } from 'lucide-react'
import type { DocItem, TemplateId, ReviewMode } from '@/hooks/useDocGenerator'
import { TEMPLATES } from '@/data/docGeneratorMockData'
import { StalenessAlert } from './StalenessAlert'

interface TopControlBarProps {
  selectedDoc: DocItem | null
  selectedTemplate: TemplateId
  onTemplateChange: (t: TemplateId) => void
  reviewMode: ReviewMode
  onEnterHunkMode: () => void
  onExitHunkMode: () => void
  acceptedCount: number
  totalHunkCount: number
  allResolved: boolean
  onAcceptAll: () => void
  onRejectAll: () => void
  onGenerate: () => void
  isGenerating?: boolean
}

export function TopControlBar({
  selectedDoc,
  selectedTemplate,
  onTemplateChange,
  reviewMode,
  onEnterHunkMode,
  onExitHunkMode,
  acceptedCount,
  totalHunkCount,
  allResolved,
  onAcceptAll,
  onRejectAll,
  onGenerate,
  isGenerating
}: TopControlBarProps) {
  const [isTemplateOpen, setIsTemplateOpen] = useState(false)
  const templateRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setIsTemplateOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentTemplateLabel = TEMPLATES[selectedTemplate]?.label || 'Select Template'

  return (
    <div className="h-14 sticky top-0 flex-shrink-0 flex items-center gap-3 px-4 border-b border-[#2A2A2A] bg-[#111] z-40">

      {/* LEFT SECTION (Breadcrumb) */}
      <div className="flex items-center gap-2 flex-1 overflow-hidden min-w-0">
        <AnimatePresence mode="wait">
          {!selectedDoc ? (
            <motion.span
              key="no-doc"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              transition={{ duration: 0.15 }}
              className="font-mono text-xs sm:text-sm text-gray-500 truncate"
            >
              Doc Generator
            </motion.span>
          ) : (
            <motion.div
              key={selectedDoc.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 min-w-0"
            >
              <span className="font-mono text-[10px] sm:text-xs text-gray-500 truncate">
                {selectedDoc.serviceId}
              </span>
              <span className="text-gray-600 font-mono mx-1">/</span>
              <span className="font-mono text-xs sm:text-sm text-gray-100 font-medium truncate">
                {selectedDoc.name}
              </span>

              {selectedDoc.health === 'stale' && (
                <div className="ml-2 hidden sm:block">
                  <StalenessAlert daysSinceUpdate={selectedDoc.daysSinceUpdate} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CENTER SECTION */}
      <div className="flex items-center gap-2">
        <div className="relative" ref={templateRef}>
          <button
            onClick={() => setIsTemplateOpen(!isTemplateOpen)}
            className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-1.5 font-mono text-[10px] sm:text-xs text-gray-400 cursor-pointer hover:border-[#6366F1] hover:text-gray-200 transition-colors"
          >
            {currentTemplateLabel}
            <ChevronDown size={12} className={`transition-transform duration-200 ${isTemplateOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isTemplateOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-1.5 right-0 w-64 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-xl z-50"
              >
                {(Object.entries(TEMPLATES) as [TemplateId, { label: string, description: string }][]).map(([key, t]) => (
                  <div
                    key={key}
                    onClick={() => {
                      onTemplateChange(key)
                      setIsTemplateOpen(false)
                    }}
                    className={`px-4 py-2.5 cursor-pointer transition-colors ${selectedTemplate === key ? 'bg-[#222]' : 'hover:bg-[#222]'
                      }`}
                  >
                    <div className={`font-mono text-xs ${selectedTemplate === key ? 'text-gray-100' : 'text-gray-300'}`}>
                      {t.label}
                    </div>
                    <div className="font-mono text-[9px] text-gray-500 mt-1 leading-snug">
                      {t.description}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {selectedDoc?.health === 'missing' && (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 bg-[#6366F1] text-white rounded-lg px-3 py-1.5 font-mono text-[10px] sm:text-xs hover:bg-[#5558E6] transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Sparkles size={12} />
            )}
            <span>{isGenerating ? 'Generating...' : 'Generate AI'}</span>
          </button>
        )}
      </div>

      {/* RIGHT SECTION */}
      <div className="items-center gap-2 hidden md:flex">
        {selectedDoc && totalHunkCount > 0 && (
          <span className={`font-mono py-1 px-1.5 text-xs ${allResolved ? 'text-green-500' : 'text-gray-500'}`}>
            {allResolved
              ? `All ${totalHunkCount} hunks resolved ✓`
              : `${acceptedCount} of ${totalHunkCount} hunks resolved`
            }
          </span>
        )}

        {selectedDoc && totalHunkCount > 0 && (
          <div className="flex items-center gap-2">
            {reviewMode !== 'hunk' ? (
              <button
                onClick={onEnterHunkMode}
                className="flex items-center gap-1.5 border border-[#2A2A2A] bg-transparent rounded-lg px-3 py-1.5 font-mono text-xs text-gray-400 hover:border-[#6366F1] hover:text-gray-200 transition-colors"
              >
                <Layers size={12} />
                <span>Review Hunk by Hunk</span>
              </button>
            ) : (
              <button
                onClick={onExitHunkMode}
                className="flex items-center gap-1.5 border border-[#2A2A2A] bg-transparent rounded-lg px-3 py-1.5 font-mono text-xs text-gray-400 hover:border-[#6366F1] hover:text-gray-200 transition-colors"
              >
                <X size={12} />
                <span>Exit Review</span>
              </button>
            )}

            <div className="w-[1px] h-4 bg-[#2A2A2A] mx-1" />

            <button
              onClick={onAcceptAll}
              disabled={allResolved}
              className="flex items-center gap-1.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg px-3 py-1.5 font-mono text-xs hover:bg-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCheck size={12} />
              <span>Accept All</span>
            </button>

            <button
              onClick={onRejectAll}
              disabled={allResolved} // prompt says disabled when no doc selected, which is true, but also probably when resolved
              className="flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg px-3 py-1.5 font-mono text-xs hover:bg-red-500/20 transition-colors"
            >
              <X size={12} />
              <span>Reject All</span>
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
