import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitPullRequest, X, Clock } from 'lucide-react';
import { SuggestionStatus } from '@/data/selfHealerMockData';

interface ActionBarProps {
    status: SuggestionStatus;
    onOpenDrawer: () => void;
    onApprove: () => void;
    onReject: () => void;
    onDefer: () => void;
}

export function ActionBar({ status, onOpenDrawer, onApprove, onReject, onDefer }: ActionBarProps) {
    return (
        <AnimatePresence>
            {status === 'pending' && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-5 py-4 border-t border-dim flex items-center gap-3"
                >
                    <span
                        className="font-mono text-xs text-muted cursor-pointer underline hover:text-secondary"
                        onClick={onOpenDrawer}
                    >
                        What does this fix?
                    </span>

                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            onClick={onDefer}
                            className="border border-dim bg-transparent rounded-lg px-4 py-2 flex items-center gap-1.5 font-mono text-xs text-secondary hover:border-focus hover:text-primary transition-colors cursor-pointer outline-none"
                        >
                            <Clock size={12} />
                            Defer
                        </button>

                        <button
                            onClick={onReject}
                            className="border border-red-500/30 bg-red-500/5 rounded-lg px-4 py-2 flex items-center gap-1.5 font-mono text-xs text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-colors cursor-pointer outline-none"
                        >
                            <X size={12} />
                            Reject
                        </button>

                        <button
                            onClick={onApprove}
                            className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg px-4 py-2 flex items-center gap-1.5 font-mono text-xs font-medium hover:bg-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer outline-none"
                        >
                            <GitPullRequest size={12} />
                            Approve & Create PR →
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
