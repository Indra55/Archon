'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/lib/useAppStore'
import { FEATURES } from '@/lib/mockData'
import { Search, BrainCircuit, SearchCode, Network, Zap, FileEdit, ShieldCheck, Compass, GitBranch, Bandage } from 'lucide-react'
import { useRouter } from 'next/navigation'

const iconMap: Record<string, React.ElementType> = {
    BrainCircuit, SearchCode, Network, Zap, FileEdit, ShieldCheck, Compass, GitBranch, Bandage
}

export function CommandPalette() {
    const { isCommandPaletteOpen, setCommandPaletteOpen } = useAppStore()
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Gather all items
    const featureItems = FEATURES.map(f => ({
        type: 'feature',
        label: f.name,
        icon: f.icon,
        route: f.route,
        category: 'FEATURES'
    }))

    const actionItems = [
        { type: 'action', label: 'Open What-If Analyzer', icon: 'Zap', route: '/dashboard/what-if', category: 'QUICK ACTIONS' },
        { type: 'action', label: 'View Knowledge Graph', icon: 'Network', route: '/dashboard/knowledge-graph', category: 'QUICK ACTIONS' },
        { type: 'action', label: 'Check CI violations', icon: 'ShieldCheck', route: '/dashboard/ci-enforcer', category: 'QUICK ACTIONS' },
        { type: 'action', label: 'Generate documentation', icon: 'FileEdit', route: '/dashboard/doc-generator', category: 'QUICK ACTIONS' },
    ]

    const allItems = [...featureItems, ...actionItems].filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase())
    )

    useEffect(() => {
        if (isCommandPaletteOpen) {
            setQuery('')
            setSelectedIndex(0)
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [isCommandPaletteOpen])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isCommandPaletteOpen) return

            if (e.key === 'Escape') {
                setCommandPaletteOpen(false)
            } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1))
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => Math.max(prev - 1, 0))
            } else if (e.key === 'Enter') {
                e.preventDefault()
                const selected = allItems[selectedIndex]
                if (selected) {
                    router.push(selected.route)
                    setCommandPaletteOpen(false)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isCommandPaletteOpen, selectedIndex, allItems, router, setCommandPaletteOpen])

    if (!isCommandPaletteOpen) return null

    // Group items by category for rendering
    const groups = Array.from(new Set(allItems.map(i => i.category)))

    let globalIndex = 0

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
            <div
                className="absolute inset-0 bg-base/70 backdrop-blur-sm"
                onClick={() => setCommandPaletteOpen(false)}
            />

            <div
                className="relative w-full max-w-[600px] bg-surface border border-dim rounded-2xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-5 py-4 border-b border-dim flex items-center gap-3">
                    <Search className="w-[18px] h-[18px] text-muted" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 font-mono text-base bg-transparent text-primary outline-none placeholder:text-muted"
                        placeholder="Go to feature, service, or doc..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setSelectedIndex(0)
                        }}
                    />
                </div>

                <div className="max-h-[400px] overflow-y-auto scrollbar-none py-2">
                    {groups.map((groupCategory) => (
                        <div key={groupCategory}>
                            <div className="font-mono text-[10px] uppercase tracking-widest text-muted px-5 py-2 bg-elevated/50 sticky top-0">
                                {groupCategory}
                            </div>

                            <div>
                                {allItems
                                    .filter(item => item.category === groupCategory)
                                    .map((item) => {
                                        const currentIndex = globalIndex++
                                        const isActive = currentIndex === selectedIndex
                                        const IconComp = iconMap[item.icon] || FileEdit

                                        return (
                                            <div
                                                key={`${item.category}-${item.label}`}
                                                onMouseEnter={() => setSelectedIndex(currentIndex)}
                                                onClick={() => {
                                                    router.push(item.route)
                                                    setCommandPaletteOpen(false)
                                                }}
                                                className={`px-5 py-3 flex items-center gap-3 cursor-pointer border-l-2 transition-colors ${isActive
                                                        ? 'bg-elevated text-primary border-accent'
                                                        : 'hover:bg-elevated text-secondary border-transparent'
                                                    }`}
                                            >
                                                <IconComp className="w-4 h-4 text-muted shrink-0" />
                                                <span className="font-mono text-sm text-primary flex-1">{item.label}</span>
                                                <span className="font-mono text-[11px] text-muted">→ {item.route.replace('/dashboard', '')}</span>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    ))}

                    {allItems.length === 0 && (
                        <div className="px-5 py-8 text-center font-mono text-sm text-muted">
                            No results found.
                        </div>
                    )}
                </div>

                <div className="px-5 py-3 border-t border-dim flex justify-between font-mono text-[11px] text-muted bg-base/50">
                    <span>↑↓ navigate</span>
                    <span>↵ select</span>
                    <span>esc close</span>
                </div>
            </div>
        </div>
    )
}
