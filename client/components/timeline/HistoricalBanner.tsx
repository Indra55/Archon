import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export function HistoricalBanner({ currentDate, onJumpToPresent }: { currentDate: Date, onJumpToPresent: () => void }) {
    const formattedDate = new Date(currentDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: -12, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -12, x: '-50%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-3 left-1/2 z-20 bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-2.5 flex items-center gap-3 font-mono text-xs shadow-lg backdrop-blur-sm"
        >
            <AlertTriangle size={13} className="text-amber-500" />
            <span className="text-amber-500">
                Viewing historical state — <span className="font-medium">{formattedDate}</span>
                <span className="text-amber-500/50 mx-2">·</span>
                <span className="underline cursor-pointer hover:text-amber-400 outline-none" onClick={onJumpToPresent}>
                    Jump to Present →
                </span>
            </span>
        </motion.div>
    );
}
