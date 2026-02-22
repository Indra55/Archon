import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, FastForward, GitCompare } from 'lucide-react';
import { TimelineEvent } from '@/data/timelineMockData';

interface TimelinePageHeaderProps {
    currentDate: Date;
    isAtPresent: boolean;
    isCompareMode: boolean;
    currentEvents: TimelineEvent[];
    compareEvents: TimelineEvent[];
    onJumpToPresent: () => void;
    onToggleCompare: () => void;
}

export function TimelinePageHeader({
    currentDate,
    isAtPresent,
    isCompareMode,
    currentEvents,
    compareEvents,
    onJumpToPresent,
    onToggleCompare
}: TimelinePageHeaderProps) {
    const formattedDate = new Date(currentDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div className="h-[56px] px-8 flex items-center justify-between border-b border-dim bg-base flex-shrink-0 z-20">
            <div className="flex items-center">
                <h1 className="font-['Syne'] text-xl font-bold text-primary">Architecture Timeline</h1>

                <div className={`ml-4 rounded-full px-3 py-1 flex items-center gap-2 font-mono text-xs bg-elevated border ${isAtPresent ? 'border-green-500/30' : 'border-dim'}`}>
                    {isAtPresent && (
                        <div className="w-[6px] h-[6px] bg-green-500 rounded-full animate-pulse" />
                    )}
                    <Calendar size={12} className="text-muted" />
                    <div className="w-[120px]">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={currentDate.toDateString()}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.15 }}
                                className="text-secondary"
                            >
                                {formattedDate}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="font-mono text-xs text-muted">
                {isCompareMode ? `${currentEvents.length} events · ${compareEvents.length} events` : `${currentEvents.length} events in history`}
            </div>

            <div className="flex items-center gap-3">
                <AnimatePresence>
                    {!isAtPresent && (
                        <motion.button
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            onClick={onJumpToPresent}
                            className="bg-surface border border-dim rounded-lg px-3 py-1.5 flex items-center gap-1.5 font-mono text-xs text-secondary hover:border-accent hover:text-primary transition-colors cursor-pointer outline-none"
                        >
                            <FastForward size={12} />
                            Jump to Present
                        </motion.button>
                    )}
                </AnimatePresence>

                <button
                    onClick={onToggleCompare}
                    className={`rounded-lg px-3 py-1.5 flex items-center gap-1.5 font-mono text-xs transition-colors cursor-pointer outline-none border ${isCompareMode ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface border-dim text-secondary hover:text-primary'}`}
                >
                    <GitCompare size={12} />
                    {isCompareMode ? 'Exit Compare' : 'Compare Dates'}
                </button>
            </div>
        </div>
    );
}
