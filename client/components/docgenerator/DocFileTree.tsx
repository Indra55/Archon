import React, { useState } from 'react'
import { ChevronLeft, PanelLeftOpen, ChevronRight } from 'lucide-react'
import { DocStatusBadge } from './DocStatusBadge'
import { motion, AnimatePresence } from 'framer-motion'

interface DocFileTreeProps {
    tree: any[]
    selectedDocId: string | null
    onSelectDoc: (id: string) => void
    isCollapsed: boolean
    onToggleCollapse: () => void
    expandedServices: string[]
    onToggleService: (id: string) => void
}

export function DocFileTree({
    tree,
    selectedDocId,
    onSelectDoc,
    isCollapsed,
    onToggleCollapse,
    expandedServices,
    onToggleService
}: DocFileTreeProps) {
    return (
        <motion.div
            initial={false}
            animate={{ width: isCollapsed ? 48 : 220 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-[#111] overflow-hidden overflow-y-auto whitespace-nowrap flex-shrink-0 flex flex-col z-30 ring-r ring-[#2A2A2A]"
            style={{ borderRight: '1px solid #2A2A2A' }}
        >
            <div className="h-12 border-b border-[#2A2A2A] px-3 flex items-center justify-center flex-shrink-0">
                <AnimatePresence mode="popLayout">
                    {isCollapsed ? (
                        <motion.button
                            key="collapsed-header"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={onToggleCollapse}
                            className="text-gray-500 hover:text-gray-200 transition-colors"
                        >
                            <PanelLeftOpen size={16} />
                        </motion.button>
                    ) : (
                        <motion.div
                            key="expanded-header"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center flex-1 justify-between min-w-0"
                        >
                            <span className="font-mono text-xs uppercase tracking-widest text-[#A1A1A1] flex-1">
                                Documents
                            </span>
                            <button
                                onClick={onToggleCollapse}
                                className="text-gray-500 hover:text-gray-200 transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                {tree.map(group => {
                    const isExpanded = expandedServices.includes(group.serviceId)

                    return (
                        <div key={group.serviceId} className="mb-1 select-none">
                            <div
                                onClick={() => onToggleService(group.serviceId)}
                                className="px-3 py-2 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                                <ChevronRight
                                    size={12}
                                    className={`text-gray-500 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
                                />

                                {!isCollapsed && (
                                    <span className="font-mono text-xs font-semibold text-gray-400">
                                        {group.serviceName}
                                    </span>
                                )}
                            </div>

                            <AnimatePresence>
                                {isExpanded && group.docs && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="overflow-hidden"
                                    >
                                        {group.docs.map((doc: any) => {
                                            const isSelected = selectedDocId === doc.id

                                            return (
                                                <div
                                                    key={doc.id}
                                                    onClick={() => onSelectDoc(doc.id)}
                                                    className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${isCollapsed ? "justify-center" : "ml-3"
                                                        } ${isSelected && !isCollapsed
                                                            ? 'bg-[#1A1A1A] text-gray-200 font-medium border-l-[2px] border-[#6366F1]'
                                                            : isCollapsed
                                                                ? 'bg-transparent text-gray-400'
                                                                : 'bg-transparent text-gray-400 hover:bg-[#1A1A1A] border-l-[1px] border-[#2A2A2A]'
                                                        }`}
                                                >
                                                    <DocStatusBadge
                                                        health={doc.health}
                                                        size={isSelected ? 8 : 6}
                                                        showTooltip={!isCollapsed}
                                                    />
                                                    {!isCollapsed && (
                                                        <span className="font-mono text-xs truncate">
                                                            {doc.name}
                                                        </span>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )
                })}
            </div>
        </motion.div>
    )
}
