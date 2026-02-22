import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DocStatusBadgeProps {
    health: 'fresh' | 'stale' | 'missing'
    size?: number
    showTooltip?: boolean
}

export function DocStatusBadge({ health, size = 6, showTooltip = false }: DocStatusBadgeProps) {
    const [isHovered, setIsHovered] = useState(false)

    const getBadgeStyle = () => {
        switch (health) {
            case 'fresh': return 'bg-green-500' // using tailwind color equivalents if custom tokens not there
            case 'stale': return 'bg-amber-500 animate-pulse'
            case 'missing': return 'bg-red-500'
        }
    }

    const getTooltipText = () => {
        switch (health) {
            case 'fresh': return 'Up to date'
            case 'stale': return 'Stale — needs review'
            case 'missing': return 'Missing — click to generate'
        }
    }

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`rounded-full ${getBadgeStyle()}`}
                style={{ width: size, height: size }}
            />

            <AnimatePresence>
                {showTooltip && isHovered && (
                    <motion.div
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.15, delay: 0.5 }}
                        className="absolute left-full ml-2 z-50 whitespace-nowrap bg-[#1E1E1E] border border-[#333] rounded-lg px-2 py-1 font-mono text-[10px] sm:text-xs text-gray-200 shadow-xl pointer-events-none"
                    >
                        {getTooltipText()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
