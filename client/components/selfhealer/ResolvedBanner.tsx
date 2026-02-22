import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { SuggestionStatus } from '@/data/selfHealerMockData';

interface ResolvedBannerProps {
    status: SuggestionStatus;
    prTitle?: string;
    prBranch?: string;
    undoLastAction: () => void;
}

export function ResolvedBanner({ status, prTitle, prBranch, undoLastAction }: ResolvedBannerProps) {
    return (
        <AnimatePresence>
            {status !== 'pending' && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`px-5 py-4 border-t border-dim flex items-center gap-3 ${status === 'approved' ? 'bg-green-500/10' : ''}`}
                >
                    {status === 'approved' && (
                        <>
                            <CheckCircle size={16} className="text-green-500" />
                            <div>
                                <p className="font-mono text-sm text-green-500 font-medium leading-none">PR created: {prTitle}</p>
                                <p className="font-mono text-xs text-green-500/70 mt-1 leading-none">{prBranch}</p>
                            </div>
                            <button
                                className="ml-auto font-mono text-xs text-green-500 hover:text-green-400 transition-colors cursor-pointer outline-none flex items-center gap-1"
                                onClick={() => window.open('#', '_blank')}
                            >
                                <ExternalLink size={12} />
                                View PR →
                            </button>
                        </>
                    )}

                    {status === 'rejected' && (
                        <>
                            <XCircle size={16} className="text-red-500/60" />
                            <span className="font-mono text-sm text-secondary">Suggestion rejected</span>
                            <button
                                className="ml-auto font-mono text-xs text-accent cursor-pointer hover:text-accent/80 transition-colors outline-none"
                                onClick={undoLastAction}
                            >
                                Undo
                            </button>
                        </>
                    )}

                    {status === 'deferred' && (
                        <>
                            <Clock size={16} className="text-muted" />
                            <span className="font-mono text-sm text-secondary">Deferred — will resurface in 7 days</span>
                            <button
                                className="ml-auto font-mono text-xs text-accent cursor-pointer hover:text-accent/80 transition-colors outline-none"
                                onClick={undoLastAction}
                            >
                                Undo
                            </button>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
