import React from 'react';
import { EventStrip } from './EventStrip';
import { TimelineScrubber } from './TimelineScrubber';
import { TimelineEvent } from '@/data/timelineMockData';

interface TimelineDockProps {
    startDate: Date;
    endDate: Date;
    currentDate: Date;
    compareDate: Date;
    isCompareMode: boolean;
    isDragging: boolean;
    isCompareDragging: boolean;
    highlightedEventId: string | null;
    hoveredEventId: string | null;
    currentEvents: TimelineEvent[];
    allEvents: TimelineEvent[];
    onCurrentDateChange: (d: Date) => void;
    onCompareDateChange: (d: Date) => void;
    onDragStart: (handle: 'primary' | 'compare') => void;
    onDragEnd: () => void;
    onEventHover: (id: string | null) => void;
    onEventClick: (id: string) => void;
}

export function TimelineDock({
    startDate, endDate, currentDate, compareDate, isCompareMode,
    isDragging, isCompareDragging, highlightedEventId, hoveredEventId,
    currentEvents, allEvents,
    onCurrentDateChange, onCompareDateChange, onDragStart, onDragEnd, onEventHover, onEventClick
}: TimelineDockProps) {
    return (
        <div className="h-[220px] flex-shrink-0 bg-surface border-t border-dim flex flex-col z-20">
            <EventStrip
                currentEvents={currentEvents}
                allEvents={allEvents}
                currentDate={currentDate}
                onEventClick={onEventClick}
            />

            <div className="flex-1 px-8 relative flex flex-col justify-center">
                <TimelineScrubber
                    startDate={startDate}
                    endDate={endDate}
                    currentDate={currentDate}
                    compareDate={compareDate}
                    isCompareMode={isCompareMode}
                    isDragging={isDragging}
                    isCompareDragging={isCompareDragging}
                    highlightedEventId={highlightedEventId}
                    hoveredEventId={hoveredEventId}
                    onCurrentDateChange={onCurrentDateChange}
                    onCompareDateChange={onCompareDateChange}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onEventHover={onEventHover}
                    onEventClick={onEventClick}
                />

                {!isDragging && !isCompareDragging && (
                    <div className="absolute bottom-4 left-0 w-full flex justify-center items-center gap-4 font-mono text-[9px] text-muted tracking-wide">
                        <span>← → Week</span>
                        <span>·</span>
                        <span>Shift+← → Month</span>
                        <span>·</span>
                        <span>E Next event</span>
                        <span>·</span>
                        <span>C Compare</span>
                        <span>·</span>
                        <span>End Present</span>
                    </div>
                )}
            </div>
        </div>
    );
}
