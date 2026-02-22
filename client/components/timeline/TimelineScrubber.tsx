import React, { useRef, useMemo, useState, useEffect } from 'react';
import { TIMELINE_EVENTS } from '@/data/timelineMockData';
import { EventDot } from './EventDot';
import { ScrubberHandle } from './ScrubberHandle';

interface TimelineScrubberProps {
    startDate: Date;
    endDate: Date;
    currentDate: Date;
    compareDate: Date;
    isCompareMode: boolean;
    isDragging: boolean;
    isCompareDragging: boolean;
    highlightedEventId: string | null;
    hoveredEventId: string | null;
    onCurrentDateChange: (d: Date) => void;
    onCompareDateChange: (d: Date) => void;
    onDragStart: (handle: 'primary' | 'compare') => void;
    onDragEnd: () => void;
    onEventHover: (id: string | null) => void;
    onEventClick: (id: string) => void;
}

export function TimelineScrubber({
    startDate, endDate, currentDate, compareDate, isCompareMode,
    isDragging, isCompareDragging, highlightedEventId, hoveredEventId,
    onCurrentDateChange, onCompareDateChange, onDragStart, onDragEnd, onEventHover, onEventClick
}: TimelineScrubberProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeHandle, setActiveHandle] = useState<'primary' | 'compare' | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    const totalMs = endMs - startMs;
    const currentMs = currentDate.getTime() - startMs;
    const compareMs = compareDate.getTime() - startMs;

    // Years logic
    const years = useMemo(() => {
        const startY = startDate.getFullYear();
        const endY = endDate.getFullYear();
        const result = [];
        for (let y = startY + 1; y <= endY; y++) {
            const yDate = new Date(`${y}-01-01`);
            if (yDate >= startDate && yDate <= endDate) {
                const pos = (yDate.getTime() - startMs) / totalMs * 100;
                result.push({ year: y, pos });
            }
        }
        return result;
    }, [startDate, endDate, startMs, totalMs]);

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!activeHandle || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        // Clamp between 0 and 1
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newTime = startMs + pct * totalMs;
        const newDate = new Date(newTime);

        if (activeHandle === 'primary') {
            onCurrentDateChange(newDate);
        } else {
            onCompareDateChange(newDate);
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (activeHandle) {
            e.currentTarget.releasePointerCapture(e.pointerId);
            setActiveHandle(null);
            onDragEnd();
        }
    };

    const handlePrimaryDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setActiveHandle('primary');
        onDragStart('primary');
    };

    const handleCompareDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setActiveHandle('compare');
        onDragStart('compare');
    };

    // Fills logic
    const pctPrimary = (currentMs / totalMs) * 100;
    const pctCompare = (compareMs / totalMs) * 100;

    const fillLeft = isCompareMode ? Math.min(pctPrimary, pctCompare) : 0;
    const fillWidth = isCompareMode ? Math.abs(pctPrimary - pctCompare) : pctPrimary;

    const formattedPrimaryDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedCompareDate = compareDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div
            className="w-full py-4 relative flex-1 flex flex-col justify-center select-none"
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <div className="relative w-full h-[32px] flex items-center">
                {/* Track Background */}
                <div className="absolute w-full h-[2px] bg-elevated rounded-full" />

                {/* Track primary fill */}
                {!isCompareMode && (
                    <div
                        className="absolute left-0 h-[2px] bg-accent rounded-full transition-all"
                        style={{ width: `${pctPrimary}%`, transitionDuration: isDragging ? '0ms' : '80ms' }}
                    />
                )}

                {/* Compare fill */}
                {isCompareMode && (
                    <div
                        className="absolute h-[2px] bg-accent/30 pointer-events-none"
                        style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
                    />
                )}

                {/* Years marks */}
                {years.map(y => (
                    <div key={y.year} className="absolute top-1/2 -translate-y-[calc(-50%+4px)] flex flex-col items-center pointer-events-none" style={{ left: `${y.pos}%` }}>
                        <div className="w-[1px] h-[8px] bg-muted mb-1" />
                        <span className="font-mono text-[9px] text-muted">{y.year}</span>
                    </div>
                ))}

                {/* Dots */}
                {TIMELINE_EVENTS.map(ev => {
                    const d = new Date(ev.date).getTime();
                    const x = (d - startMs) / totalMs * 100;
                    const isInPast = d <= currentDate.getTime();
                    return (
                        <div key={ev.id} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${x}%` }}>
                            <EventDot
                                event={ev}
                                isInPast={isInPast}
                                isHighlighted={highlightedEventId === ev.id}
                                isHovered={hoveredEventId === ev.id}
                                onHover={onEventHover}
                                onClick={() => onEventClick(ev.id)}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Handlers (Z-index above dots) */}
            <div className="absolute inset-x-0 inset-y-0 pointer-events-none">
                <div className="relative w-full h-full pointer-events-auto">
                    {isMounted && (
                        <div className="absolute top-1/2 -translate-y-1/2 w-full h-full" style={{ position: 'absolute', pointerEvents: 'none' }}>
                            {containerRef.current && (
                                <ScrubberHandle
                                    x={(containerRef.current.offsetWidth * pctPrimary) / 100}
                                    color="accent"
                                    label={formattedPrimaryDate}
                                    isDragging={activeHandle === 'primary' || isDragging}
                                    onPointerDown={handlePrimaryDown}
                                />
                            )}
                        </div>
                    )}

                    {isMounted && isCompareMode && containerRef.current && (
                        <div className="absolute top-1/2 -translate-y-1/2 w-full h-full" style={{ position: 'absolute', pointerEvents: 'none' }}>
                            <ScrubberHandle
                                x={(containerRef.current.offsetWidth * pctCompare) / 100}
                                color="amber"
                                label={formattedCompareDate}
                                isDragging={activeHandle === 'compare' || isCompareDragging}
                                onPointerDown={handleCompareDown}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
