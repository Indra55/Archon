import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScrubberHandleProps {
    x: number;
    color: 'accent' | 'amber';
    label: string;
    isDragging: boolean;
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export function ScrubberHandle({ x, color, label, isDragging, onPointerDown }: ScrubberHandleProps) {
    const bgClass = color === 'accent' ? 'bg-accent' : 'bg-amber-500';
    const shadowClass = color === 'accent' ? '0 0 0 4px rgba(99,102,241,0.2)' : '0 0 0 4px rgba(245,158,11,0.2)';

    return (
        <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-40 touch-none flex flex-col items-center justify-center"
            style={{ left: `${x}px` }}
            onPointerDown={onPointerDown}
        >
            <AnimatePresence>
                {isDragging && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute bottom-full mb-2 bg-elevated border border-dim rounded-lg px-2.5 py-1 font-mono text-xs text-primary whitespace-nowrap pointer-events-none shadow"
                    >
                        {label}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                className={`w-[20px] h-[20px] rounded-full border-2 border-white cursor-col-resize ${bgClass}`}
                style={{ boxShadow: shadowClass }}
                animate={{ scale: isDragging ? 1.2 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            />
        </div>
    );
}
