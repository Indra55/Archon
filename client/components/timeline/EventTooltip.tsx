import React from 'react';
import { TimelineEvent, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '@/data/timelineMockData';

// Simulated external components
function SeverityBadge({ level }: { level: string }) {
    if (level === 'critical') return <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">Critical</span>;
    return <span className="text-[10px] uppercase">{level}</span>;
}

interface EventTooltipProps {
    event: TimelineEvent;
}

export function EventTooltip({ event }: EventTooltipProps) {
    const color = EVENT_TYPE_COLORS[event.type];
    const label = EVENT_TYPE_LABELS[event.type];
    const dateFormatted = new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-elevated border border-dim rounded-xl px-4 py-3 min-w-[240px] max-w-[320px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-[8px] h-[8px] rounded-full" style={{ backgroundColor: color }} />
                <span className="font-mono text-[10px] uppercase tracking-wider font-semibold" style={{ color }}>{label}</span>
                <span className="font-mono text-[10px] text-muted ml-auto">{dateFormatted}</span>
            </div>

            <h4 className="font-mono text-sm text-primary font-medium leading-snug">{event.title}</h4>

            <p className="mt-1.5 font-mono text-[10px] text-secondary leading-relaxed">
                {event.detail.length > 120 ? event.detail.substring(0, 120) + '...' : event.detail}
            </p>

            <div className="mt-3 pt-2 border-t border-dim flex items-center gap-3">
                {event.author && <span className="font-mono text-[10px] text-muted">{event.author}</span>}
                {event.prNumber && <span className="font-mono text-[10px] text-accent">PR #{event.prNumber}</span>}
                {event.severity && <SeverityBadge level={event.severity} />}

                <span className="font-mono text-[10px] text-muted italic ml-auto pointer-events-auto">Click to jump →</span>
            </div>

            <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] rotate-45 bg-elevated border-b border-r border-dim" />
        </div>
    );
}
