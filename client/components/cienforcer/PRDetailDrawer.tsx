import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitBranch, CheckCircle, XCircle, Loader2, ExternalLink, Zap, CheckSquare, CheckSquare as CheckSquare2 } from 'lucide-react';
import { PRItem } from '@/data/ciEnforcerMockData';
import { SeverityBadge } from '../shared/SeverityBadge';
import { ViolationItem } from './ViolationItem';

interface PRDetailDrawerProps {
    pr: PRItem;
    isReviewed: boolean;
    onClose: () => void;
    onMarkReviewed: () => void;
    onViolationAction: (route: string) => void;
    onTestScenario: (scenario: string) => void;
}

export function PRDetailDrawer({
    pr,
    isReviewed,
    onClose,
    onMarkReviewed,
    onViolationAction,
    onTestScenario
}: PRDetailDrawerProps) {

    const hasFailures = pr.violations.length > 0;

    // Create checks list
    const checks = [
        { name: 'API Documentation Check', keyword: 'API documentation' },
        { name: 'ADR Compliance Check', keyword: 'ADR' },
        { name: 'Architecture Drift Check', keyword: 'Architecture drift' },
        { name: 'Runbook Check', keyword: 'runbook' },
        { name: 'OpenAPI Spec Validation', keyword: 'API documentation' },
        { name: 'Documentation Staleness', keyword: 'Stale' },
        { name: 'Knowledge Graph Sync', keyword: '' }, // Always passes if not pending
    ];

    const getCheckStatus = (keyword: string) => {
        if (pr.status === 'pending') return 'pending';
        if (!keyword) return 'passed';

        const isFailed = pr.violations.some(v => v.type.toLowerCase().includes(keyword.toLowerCase()) || v.detail.toLowerCase().includes(keyword.toLowerCase()));

        return isFailed ? 'failed' : 'passed';
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="fixed inset-0 bg-black z-40"
                onClick={onClose}
            />

            <motion.div
                initial={{ x: 480 }}
                animate={{ x: 0 }}
                exit={{ x: 480 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-0 right-0 bottom-0 w-[480px] bg-[#111] border-l border-[#2A2A2A] z-50 flex flex-col shadow-2xl overflow-y-auto overflow-x-hidden"
            >
                <div className="px-6 py-5 border-b border-[#2A2A2A] flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2 flex-1">
                        <span className="font-mono text-sm text-[#737373]">#{pr.number}</span>
                        <span className="font-mono text-sm text-[#E5E5E5] font-medium ml-2 flex-1 truncate">{pr.title}</span>
                    </div>
                    <button onClick={onClose} className="text-[#A1A1A1] hover:text-[#E5E5E5] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-[#2A2A2A] flex items-center gap-4 flex-wrap flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-[#1A1A1A] text-[#A1A1A1] font-mono text-[10px] flex items-center justify-center">
                            {pr.authorInitials}
                        </div>
                        <span className="font-mono text-xs text-[#A1A1A1]">{pr.author}</span>
                    </div>

                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-full px-2 py-0.5 font-mono text-[10px] text-[#A1A1A1]">
                        {pr.team}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <GitBranch size={12} className="text-[#A1A1A1]" />
                        <span className="font-mono text-xs text-[#A1A1A1]">{pr.branch}</span>
                    </div>

                    <span className="font-mono text-xs text-[#737373]">{pr.timeAgo}</span>

                    <div className="ml-auto">
                        {pr.status === 'flagged' ? (
                            <SeverityBadge level="critical" size="xs" />
                        ) : pr.status === 'passing' ? (
                            <span className="font-mono text-xs text-green-500 font-bold uppercase tracking-widest">Passing</span>
                        ) : (
                            <span className="font-mono text-xs text-amber-500 font-bold uppercase tracking-widest">Pending</span>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-b border-[#2A2A2A] grid grid-cols-4 gap-3 flex-shrink-0">
                    <div className="bg-[#1A1A1A] rounded-xl p-3 text-center">
                        <div className={`font-['Syne'] text-lg font-bold ${pr.checksRun > pr.checksPassed ? 'text-red-500' : 'text-green-500'}`}>
                            {pr.checksPassed}/{pr.checksRun}
                        </div>
                        <div className="font-mono text-[10px] uppercase text-[#737373] mt-0.5">CHECKS</div>
                    </div>
                    <div className="bg-[#1A1A1A] rounded-xl p-3 text-center">
                        <div className="font-['Syne'] text-lg font-bold text-[#E5E5E5]">{pr.filesChanged}</div>
                        <div className="font-mono text-[10px] uppercase text-[#737373] mt-0.5">FILES</div>
                    </div>
                    <div className="bg-[#1A1A1A] rounded-xl p-3 text-center">
                        <div className="font-['Syne'] text-lg font-bold text-[#E5E5E5]">{pr.linesChanged}</div>
                        <div className="font-mono text-[10px] uppercase text-[#737373] mt-0.5">LINES</div>
                    </div>
                    <div className="bg-[#1A1A1A] rounded-xl p-3 text-center">
                        <div className={`font-['Syne'] text-lg font-bold ${pr.violations.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {pr.violations.length}
                        </div>
                        <div className="font-mono text-[10px] uppercase text-[#737373] mt-0.5">VIOLATIONS</div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col">
                    {pr.violations.length > 0 && (
                        <div className="flex flex-col">
                            <div className="px-6 pt-5 pb-2">
                                <h3 className="font-mono text-xs uppercase tracking-widest text-[#737373]">Violations</h3>
                            </div>
                            <div>
                                {pr.violations.map(v => (
                                    <ViolationItem
                                        key={v.id}
                                        violation={v}
                                        onAction={onViolationAction}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col mb-10">
                        <div className="px-6 pt-5 pb-2">
                            <h3 className="font-mono text-xs uppercase tracking-widest text-[#737373]">All Checks</h3>
                        </div>
                        <div>
                            {checks.map((check, i) => {
                                const status = getCheckStatus(check.keyword);
                                return (
                                    <div key={i} className="px-6 py-3 border-b border-[#2A2A2A] last:border-0 flex items-center gap-3">
                                        {status === 'passed' && <CheckCircle size={14} className="text-green-500" />}
                                        {status === 'failed' && <XCircle size={14} className="text-red-500" />}
                                        {status === 'pending' && <Loader2 size={14} className="text-amber-500 animate-spin" />}

                                        <span className="font-mono text-sm text-[#E5E5E5]">{check.name}</span>

                                        <span className="font-mono text-xs text-[#737373] ml-auto">
                                            {status === 'pending' ? '--' : `${(1.2 + Math.random() * 2).toFixed(1)}s`}
                                        </span>

                                        <span className={`font-mono text-xs w-[60px] text-right ${status === 'passed' ? 'text-green-500' :
                                                status === 'failed' ? 'text-red-500' : 'text-amber-500'
                                            }`}>
                                            {status === 'passed' ? 'Passed' :
                                                status === 'failed' ? 'Failed' : 'Running'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-[#111] border-t border-[#2A2A2A] px-6 py-4 flex items-center gap-3 z-20">
                    <button
                        onClick={() => window.open('#', '_blank')}
                        className="flex items-center gap-1.5 text-[#A1A1A1] hover:text-[#E5E5E5] transition-colors pr-2 border-r border-[#2A2A2A]"
                    >
                        <ExternalLink size={14} />
                        <span className="font-mono text-sm">View on GitHub &rarr;</span>
                    </button>

                    <button
                        onClick={() => {
                            onTestScenario(`What happens if PR #${pr.number} changes are reverted`);
                            onClose();
                        }}
                        className="flex items-center gap-1.5 text-[#A1A1A1] hover:text-[#6366F1] transition-colors"
                    >
                        <Zap size={14} />
                        <span className="font-mono text-sm">Open in What-If &rarr;</span>
                    </button>

                    <div className="ml-auto">
                        {isReviewed ? (
                            <button
                                onClick={() => {
                                    onMarkReviewed();
                                    onClose();
                                }}
                                className="flex items-center gap-1.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg px-4 py-2 font-mono text-sm"
                            >
                                <CheckSquare2 size={14} />
                                <span>Reviewed</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    onMarkReviewed();
                                    onClose();
                                }}
                                className="bg-[#6366F1] hover:bg-[#5558e6] text-white rounded-lg px-4 py-2 font-mono text-sm transition-colors"
                            >
                                Mark as Reviewed
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    );
}
