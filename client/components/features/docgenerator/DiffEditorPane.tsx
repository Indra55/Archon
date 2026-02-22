'use client'

import { memo } from 'react'
import dynamic from 'next/dynamic'

const DiffEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.DiffEditor),
  { ssr: false }
)

interface DiffEditorPaneProps {
  original: string
  modified: string
  language?: string
  onModifiedChange?: (value: string) => void
}

function DiffEditorPaneInner({
  original,
  modified,
  language = 'markdown',
  onModifiedChange,
}: DiffEditorPaneProps) {
  return (
    <div className="h-full min-h-[300px] bg-[#1e1e1e] rounded-lg overflow-hidden border border-dim">
      <DiffEditor
        height="100%"
        language={language}
        original={original}
        modified={modified}
        options={{
          readOnly: !onModifiedChange,
          renderSideBySide: true,
          enableSplitViewResizing: true,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'IBM Plex Mono', 'JetBrains Mono', monospace",
          scrollBeyondLastLine: false,
          renderOverviewRuler: false,
        }}
        onMount={(editor) => {
          if (onModifiedChange) {
            const modifiedModel = editor.getModel()?.modified
            modifiedModel?.onDidChangeContent(() => {
              onModifiedChange(modifiedModel.getValue())
            })
          }
        }}
      />
    </div>
  )
}

export const DiffEditorPane = memo(DiffEditorPaneInner)
