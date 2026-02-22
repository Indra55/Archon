import React from 'react';
import { DiffEditor } from '@monaco-editor/react';

interface DiffViewerProps {
    original: string;
    modified: string;
    language: string;
    height?: number;
}

export function DiffViewer({ original, modified, language, height = 240 }: DiffViewerProps) {
    return (
        <div style={{ height }} className="overflow-hidden bg-[#1E1E1E]">
            <DiffEditor
                height={height}
                language={language}
                original={original}
                modified={modified}
                theme="vs-dark"
                options={{
                    readOnly: true,
                    renderSideBySide: true,
                    minimap: { enabled: false },
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    lineNumbers: 'off',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    diffWordWrap: 'on',
                    originalEditable: false,
                    padding: { top: 12, bottom: 12 },
                    scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
                }}
                loading={<div className="w-full h-full bg-elevated animate-pulse rounded-lg" />}
            />
        </div>
    );
}
