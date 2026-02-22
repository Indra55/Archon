import React from 'react'
import { Code2 } from 'lucide-react'

export interface CitationChipProps {
    filename: string
    line: number
    onClick?: () => void
}

export function CitationChip({ filename, line, onClick }: CitationChipProps) {
    return (
        <div
            onClick={onClick}
            className={`inline-flex items-center gap-1 bg-elevated border border-dim rounded px-2 py-0.5 font-mono text-xs text-secondary transition duration-120 ease-in-out ${onClick ? 'cursor-pointer hover:border-focus hover:text-primary' : ''
                }`}
        >
            <Code2 className="w-[10px] h-[10px] text-muted shrink-0" />
            <span>
                {filename}:{line}
            </span>
        </div>
    )
}
