import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, Loader2, Undo2 } from 'lucide-react';
import { HealthScoreRing } from './HealthScoreRing';

// Mock hook since Dashboard one might not be shared correctly
function useLocalCountUp(end: number) {
    const [value, setValue] = React.useState(0);
    React.useEffect(() => {
        let startTime: number;
        let animationFrame: number;
        const animate = (time: number) => {
            if (!startTime) startTime = time;
            const progress = Math.min((time - startTime) / 1000, 1);
            setValue(Math.floor(0 + (end - 0) * progress));
            if (progress < 1) animationFrame = requestAnimationFrame(animate);
            else setValue(end);
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end]);
    return value;
}

interface SelfHealerHeaderProps {
    healthScore: number;
    previousHealthScore: number;
    isScoreAnimating: boolean;
    stats: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        deferred: number;
        estimatedHoursAutoSaved: number;
    };
    isScanning: boolean;
    onScan: () => void;
    canUndo: boolean;
    onUndo: () => void;
}

export function SelfHealerHeader({
    healthScore, previousHealthScore, isScoreAnimating, stats,
    isScanning, onScan, canUndo, onUndo
}: SelfHealerHeaderProps) {

    const pendingCount = useLocalCountUp(stats.pending);
    const approvedCount = useLocalCountUp(stats.approved);
    const deferredCount = useLocalCountUp(stats.deferred);
    const hoursCount = useLocalCountUp(stats.estimatedHoursAutoSaved);

    return (
        <div className="px-8 py-6 border-b border-dim bg-surface flex flex-row items-center min-h-[140px] flex-shrink-0">

            <HealthScoreRing
                score={healthScore}
                previousScore={previousHealthScore}
                isAnimating={isScoreAnimating}
            />

            <div className="flex flex-col justify-center ml-8 gap-1">
                <div>
                    <h1 className="font-['Syne'] text-xl font-bold text-primary">System Health Score</h1>
                    <p className="font-mono text-xs text-muted mt-0.5">Based on {stats.total} detected patterns</p>
                </div>

                <div className="flex items-center gap-6 mt-4">
                    <div className="flex flex-col gap-0.5">
                        <span className="font-['Syne'] text-2xl font-bold text-amber-500">{pendingCount}</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">PENDING</span>
                    </div>

                    <div className="h-8 w-px bg-dim self-center mx-2" />

                    <div className="flex flex-col gap-0.5">
                        <span className="font-['Syne'] text-2xl font-bold text-green-500">{approvedCount}</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">APPROVED</span>
                    </div>

                    <div className="h-8 w-px bg-dim self-center mx-2" />

                    <div className="flex flex-col gap-0.5">
                        <span className="font-['Syne'] text-2xl font-bold text-secondary">{deferredCount}</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">DEFERRED</span>
                    </div>

                    <div className="h-8 w-px bg-dim self-center mx-2" />

                    <div className="flex flex-col gap-0.5">
                        <span className="font-['Syne'] text-2xl font-bold text-accent">{hoursCount}h</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">HOURS SAVED</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end justify-center gap-3 ml-auto">
                <button
                    onClick={onScan}
                    disabled={isScanning}
                    className={`rounded-xl px-5 py-2.5 flex items-center gap-2 font-mono text-sm font-medium transition-all ${isScanning ? 'bg-accent/70 text-white cursor-not-allowed' : 'bg-accent text-white hover:bg-accent/90 cursor-pointer'}`}
                >
                    {isScanning ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
                    {isScanning ? 'Scanning...' : 'Run Full Scan'}
                </button>

                <span className="font-mono text-xs text-muted">Last scanned: 2 hours ago</span>

                <AnimatePresence>
                    {canUndo && (
                        <motion.button
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            onClick={onUndo}
                            className="border border-dim bg-transparent rounded-lg px-3 py-1.5 flex items-center gap-1.5 font-mono text-xs text-secondary hover:border-accent hover:text-primary transition-colors cursor-pointer"
                        >
                            <Undo2 size={12} />
                            Undo last action
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

        </div>
    );
}
