import React, { useRef, useEffect } from 'react';
import { TimelineEvent, MAJOR_EVENT_TYPES, EVENT_TYPE_COLORS } from '@/data/timelineMockData';

interface EventStripProps {
    currentEvents: TimelineEvent[];
    allEvents: TimelineEvent[];
    currentDate: Date;
    onEventClick: (id: string) => void;
}

export function EventStrip({ currentEvents, allEvents, currentDate, onEventClick }: EventStripProps) {
    const majorEvents = allEvents.filter(e => MAJOR_EVENT_TYPES.includes(e.type));
    const containerRef = useRef<HTMLDivElement>(null);
    const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    useEffect(() => {
        // Find last event that has occurred
        const pastEvents = majorEvents.filter(e => new Date(e.date) <= currentDate);
        const lastEvent = pastEvents[pastEvents.length - 1];

        if (lastEvent && pillRefs.current[lastEvent.id] && containerRef.current) {
            pillRefs.current[lastEvent.id]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, [currentDate, majorEvents]);

    return (
        <div ref={containerRef} className="h-[40px] border-b border-dim px-6 flex items-center gap-2 overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {majorEvents.map(e => {
                const isPast = new Date(e.date) <= currentDate;
                const color = EVENT_TYPE_COLORS[e.type];
                return (
                    <button
                        key={e.id}
                        ref={el => { pillRefs.current[e.id] = el }}
                        onClick={() => isPast ? onEventClick(e.id) : undefined}
                        className={`flex-shrink-0 bg-elevated border rounded-full px-3 py-1.5 flex items-center gap-1.5 font-mono text-xs whitespace-nowrap transition-all ${isPast ? 'text-primary border-dim hover:border-muted cursor-pointer' : 'opacity-30 border-dim cursor-not-allowed text-secondary'}`}
                    >
                        <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: color }} />
                        {e.title.length > 30 ? e.title.substring(0, 30) : e.title}
                    </button>
                );
            })}
        </div>
    );
}
