import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeline } from '@/hooks/useTimeline';
import { useDebounce } from '@/hooks/useDebounce';
import { TIMELINE_EVENTS } from '@/data/timelineMockData';
import { TimelinePageHeader } from './TimelinePageHeader';
import { TimeAwareGraph } from './TimeAwareGraph';
import { CompareOverlay } from './CompareOverlay';
import { HistoricalBanner } from './HistoricalBanner';
import { TimelineDock } from './TimelineDock';

export function TimelinePage() {
    const tl = useTimeline();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Ensure we handle URL params on mount
    useEffect(() => {
        const dateParam = searchParams.get('date');
        const eventParam = searchParams.get('event');
        const compareParam = searchParams.get('compare');

        if (dateParam) {
            tl.setCurrentDate(new Date(dateParam));
        }
        if (eventParam) {
            tl.jumpToEvent(eventParam);
        }
        if (compareParam) {
            if (!tl.isCompareMode) tl.toggleCompareMode();
            tl.setCompareDate(new Date(compareParam));
        }
    }, []);

    const debouncedCurrentDate = useDebounce(tl.currentDate, 80);
    const debouncedCompareDate = useDebounce(tl.compareDate, 80);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const ONE_DAY = 86400000;

        if (e.key === 'ArrowLeft') {
            const daysOffset = e.shiftKey ? 30 : 7;
            const newDate = new Date(Math.max(tl.startDate.getTime(), tl.currentDate.getTime() - daysOffset * ONE_DAY));
            tl.setCurrentDate(newDate);
        } else if (e.key === 'ArrowRight') {
            const daysOffset = e.shiftKey ? 30 : 7;
            const newDate = new Date(Math.min(tl.endDate.getTime(), tl.currentDate.getTime() + daysOffset * ONE_DAY));
            tl.setCurrentDate(newDate);
        } else if (e.key === 'Home') {
            tl.setCurrentDate(tl.startDate);
        } else if (e.key === 'End') {
            tl.jumpToPresent();
        } else if (e.key === 'c' || e.key === 'C') {
            tl.toggleCompareMode();
        } else if (e.key === 'e') {
            // Next event
            const upcoming = TIMELINE_EVENTS.find(ev => new Date(ev.date) > tl.currentDate);
            if (upcoming) tl.jumpToEvent(upcoming.id);
        } else if (e.key === 'E') {
            // Previous event
            const pastEvents = TIMELINE_EVENTS.filter(ev => new Date(ev.date) < tl.currentDate);
            if (pastEvents.length > 0) tl.jumpToEvent(pastEvents[pastEvents.length - 1].id);
        }
    };

    return (
        <div
            className="bg-base flex flex-col overflow-hidden outline-none"
            style={{ height: 'calc(100vh - 56px)' }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            <TimelinePageHeader
                currentDate={tl.currentDate}
                isAtPresent={tl.isAtPresent}
                isCompareMode={tl.isCompareMode}
                currentEvents={tl.currentEvents}
                compareEvents={tl.compareEvents}
                onJumpToPresent={tl.jumpToPresent}
                onToggleCompare={tl.toggleCompareMode}
            />

            <div className="flex-1 min-h-0 relative">
                <AnimatePresence mode="wait">
                    {tl.isCompareMode ? (
                        <motion.div key="compare" className="w-full h-full"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                            <CompareOverlay
                                primaryDate={debouncedCurrentDate}
                                compareDate={debouncedCompareDate}
                            />
                        </motion.div>
                    ) : (
                        <motion.div key="single" className="w-full h-full"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                            <TimeAwareGraph
                                currentDate={debouncedCurrentDate}
                                isCompareMode={false}
                                onNodeClick={(serviceId) =>
                                    router.push('/dashboard/knowledge-graph?highlight=' + serviceId)
                                }
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {!tl.isAtPresent && !tl.isCompareMode && (
                        <HistoricalBanner
                            currentDate={tl.currentDate}
                            onJumpToPresent={tl.jumpToPresent}
                        />
                    )}
                </AnimatePresence>
            </div>

            <TimelineDock
                startDate={tl.startDate}
                endDate={tl.endDate}
                currentDate={tl.currentDate}
                compareDate={tl.compareDate}
                isCompareMode={tl.isCompareMode}
                isDragging={tl.isDragging}
                isCompareDragging={tl.isCompareDragging}
                highlightedEventId={tl.highlightedEventId}
                hoveredEventId={tl.hoveredEventId}
                currentEvents={tl.currentEvents}
                allEvents={TIMELINE_EVENTS}
                onCurrentDateChange={tl.setCurrentDate}
                onCompareDateChange={tl.setCompareDate}
                onDragStart={(h) => h === 'primary' ? tl.setIsDragging(true) : tl.setIsCompareDragging(true)}
                onDragEnd={() => {
                    tl.setIsDragging(false);
                    tl.setIsCompareDragging(false);
                }}
                onEventHover={tl.setHoveredEventId}
                onEventClick={tl.jumpToEvent}
            />
        </div>
    );
}
