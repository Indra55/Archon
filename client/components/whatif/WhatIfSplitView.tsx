'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GripVertical } from 'lucide-react'

export function WhatIfSplitView({
    children
}: {
    children: [React.ReactNode, React.ReactNode]
}) {
    const [leftWidthPercent, setLeftWidthPercent] = useState(38)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        isDragging.current = true
        const handlePointerMove = (moveEvent: PointerEvent) => {
            if (!isDragging.current || !containerRef.current) return
            const containerRect = containerRef.current.getBoundingClientRect()
            let newPercent = ((moveEvent.clientX - containerRect.left) / containerRect.width) * 100
            newPercent = Math.max(28, Math.min(50, newPercent))
            setLeftWidthPercent(newPercent)
        }

        const handlePointerUp = () => {
            isDragging.current = false
            document.removeEventListener('pointermove', handlePointerMove)
            document.removeEventListener('pointerup', handlePointerUp)
            document.body.style.cursor = 'default'
        }

        document.addEventListener('pointermove', handlePointerMove)
        document.addEventListener('pointerup', handlePointerUp)
        document.body.style.cursor = 'col-resize'
    }

    return (
        <div ref={containerRef} className="w-full flex h-[calc(100vh-56px)] overflow-hidden">
            <motion.div
                initial={{ x: -32, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: `${leftWidthPercent}%` }}
                className="h-full shrink-0"
            >
                {children[0]}
            </motion.div>

            <div
                className="w-[1px] bg-dim h-full relative group cursor-col-resize hover:bg-focus transition-colors z-20 shrink-0"
                onPointerDown={handlePointerDown}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28px] h-[28px] bg-elevated border border-dim rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-[14px] h-[14px] text-muted" />
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.32, delay: 0.08 }}
                style={{ width: `${100 - leftWidthPercent}%` }}
                className="h-full shrink-0"
            >
                {children[1]}
            </motion.div>
        </div>
    )
}
