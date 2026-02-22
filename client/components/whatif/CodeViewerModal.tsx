'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FileCode, ExternalLink, X } from 'lucide-react'
// @ts-ignore
import Editor from '@monaco-editor/react'
import { CODE_SNIPPETS } from '@/data/whatIfMockData'

interface CodeViewerModalProps {
    isOpen: boolean
    filename: string
    line: number
    onClose: () => void
}

export function CodeViewerModal({ isOpen, filename, line, onClose }: CodeViewerModalProps) {
    if (!isOpen) return null

    const fileRef = `${filename}:${line}`
    const snippet = CODE_SNIPPETS[fileRef] || { language: 'plaintext', code: '// Source not available in mock mode' }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[720px] bg-surface border border-dim rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.7)] relative z-10"
            >
                <div className="px-5 py-4 border-b border-dim flex items-center justify-between">
                    <div className="flex items-center">
                        <FileCode className="w-4 h-4 text-muted" />
                        <span className="font-mono text-sm text-primary ml-2">{filename}</span>
                        <span className="font-mono text-xs text-secondary ml-0.5">:{line}</span>
                    </div>

                    <div className="flex items-center">
                        <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-1 font-mono text-xs text-accent hover:underline">
                            <ExternalLink className="w-[14px] h-[14px]" />
                            Open in GitHub →
                        </a>
                        <div className="w-[1px] h-4 bg-dim mx-3" />
                        <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
                            <X className="w-[18px] h-[18px]" />
                        </button>
                    </div>
                </div>

                <div className="h-[280px]">
                    <Editor
                        key={`${fileRef}`} // forces remount to properly select line
                        height="100%"
                        language={snippet.language}
                        theme="vs-dark"
                        value={snippet.code}
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 13,
                            fontFamily: "'JetBrains Mono', monospace",
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            renderLineHighlight: "line",
                            lineDecorationsWidth: 8,
                            padding: { top: 16, bottom: 16 }
                        }}
                        onMount={(editor: any, monaco: any) => {
                            // Highlight the specific line visually
                            editor.setSelection(new monaco.Selection(1, 1, 1, 1))
                        }}
                    />
                </div>

                <div className="px-5 py-3 border-t border-dim flex items-center justify-between">
                    <span className="font-mono text-xs text-muted">Viewing mock source — real integration connects to your repo</span>
                    <button onClick={onClose} className="px-3 py-1.5 border border-dim hover:bg-elevated rounded-lg font-mono text-xs text-secondary hover:text-primary transition-colors">
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
