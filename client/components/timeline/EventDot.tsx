import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineEvent, EVENT_TYPE_COLORS } from '@/data/timelineMockData';
import { EventTooltip } from './EventTooltip';

interface EventDotProps {
    event: TimelineEvent;
    isInPast: boolean;
    isHighlighted: boolean;
    isHovered: boolean;
    onHover: (id: string | null) => void;
    onClick: () => void;
}

export function EventDot({ event, isInPast, isHighlighted, isHovered, onHover, onClick }: EventDotProps) {
    const color = EVENT_TYPE_COLORS[event.type];

    return (
        <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            onMouseEnter={() => onHover(event.id)}
            onMouseLeave={() => onHover(null)}
            onClick={isInPast ? onClick : undefined}
            style={{ cursor: isInPast ? 'pointer' : 'default' }}
        >
            <motion.div
                className="w-[8px] h-[8px] rounded-full relative"
                style={{ backgroundColor: color }}
                animate={{ scale: isHovered ? 1.4 : 1, opacity: isInPast ? 1 : 0.25 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
            >
                {isHighlighted && (
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[16px] h-[16px] rounded-full animate-ping pointer-events-none"
                        style={{ border: `2px solid ${color}` }}
                    />
                )}
            </motion.div>

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                    >
                        <EventTooltip event={event} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
