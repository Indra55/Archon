import React from 'react';
import { motion } from 'framer-motion';
import { ScanLine } from 'lucide-react';

export function ScanProgressBar({ scanProgress }: { scanProgress: number }) {
    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
        >
            <div className="px-8 py-4 bg-surface/50 border-b border-dim">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <ScanLine size={14} className="text-accent animate-pulse" />
                        <span className="font-mono text-sm text-primary">Scanning codebase for patterns...</span>
                    </div>
                    <span className="font-mono text-sm text-accent font-medium">{scanProgress}%</span>
                </div>

                <div className="bg-elevated rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-accent h-full rounded-full transition-all duration-100 ease-linear"
                        style={{ width: `${scanProgress}%` }}
                    />
                </div>

                <div className="mt-3 flex gap-6 min-h-[20px]">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted">
                        <ScanLine size={10} />
                        <span>Checking retry patterns...</span>
                    </div>

                    <motion.div
                        className="flex items-center gap-1.5 font-mono text-[10px] text-muted"
                        initial={{ opacity: 0 }} animate={{ opacity: scanProgress >= 30 ? 1 : 0 }}
                    >
                        <ScanLine size={10} />
                        <span>Analysing timeout configs...</span>
                    </motion.div>

                    <motion.div
                        className="flex items-center gap-1.5 font-mono text-[10px] text-muted"
                        initial={{ opacity: 0 }} animate={{ opacity: scanProgress >= 60 ? 1 : 0 }}
                    >
                        <ScanLine size={10} />
                        <span>Comparing ADR compliance...</span>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
