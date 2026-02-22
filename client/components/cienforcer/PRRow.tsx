import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, ChevronDown, GitBranch, ExternalLink, CheckSquare, Check } from 'lucide-react';
import { PRItem } from '@/data/ciEnforcerMockData';
import { SeverityBadge } from '../shared/SeverityBadge';
import { ViolationItem } from './ViolationItem';

interface PRRowProps {
    pr: PRItem;
    isExpanded: boolean;
    isReviewed: boolean;
    onToggle: () => void;
    onOpenDrawer: () => void;
    onMarkReviewed: () => void;
    onViolationAction: (route: string) => void;
}

export function PRRow({
    pr,
    isExpanded,
    isReviewed,
    onToggle,
    onOpenDrawer,
    onMarkReviewed,
    onViolationAction
}: PRRowProps) {

    const Footer = () => (
        <div className="px-5 py-3 border-t border-[#2A2A2A] flex items-center gap-3">
            <GitBranch size={12} className="text-[#A1A1A1]" />
            <span className="font-mono text-xs text-[#A1A1A1]">{pr.branch}</span>
            <span className="text-[#A1A1A1]">·</span>
            <span className="font-mono text-xs text-[#A1A1A1]">{pr.filesChanged} files changed</span>
            <span className="text-[#A1A1A1]">·</span>
            <span className="font-mono text-xs text-[#A1A1A1]">{pr.linesChanged} lines</span>

            <div className="ml-auto flex items-center gap-3">
                <button
                    onClick={() => window.open('#', '_blank')}
                    className="flex items-center gap-1.5 font-mono text-xs text-[#A1A1A1] hover:text-[#E5E5E5] transition-colors"
                >
                    <ExternalLink size={12} />
                    <span>View on GitHub &rarr;</span>
                </button>

                <button
                    onClick={onMarkReviewed}
                    className={`flex items-center gap-1.5 border rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${isReviewed
                            ? 'border-green-500/20 text-green-500 bg-green-500/10'
                            : 'border-[#2A2A2A] text-[#A1A1A1] hover:text-[#E5E5E5] hover:border-[#6366F1]'
                        }`}
                >
                    {isReviewed ? <Check size={12} /> : <CheckSquare size={12} />}
                    <span>{isReviewed ? 'Reviewed' : 'Mark as Reviewed'}</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="bg-[#111] border border-[#2A2A2A] rounded-2xl mb-3 overflow-hidden">
            {/* COLLAPSED ROW */}
            <div
                onClick={onToggle}
                className="flex items-center px-5 gap-4 h-[60px] cursor-pointer hover:bg-[#1A1A1A]/30 transition-colors duration-120"
            >
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${pr.status === 'flagged' ? 'bg-red-500 animate-pulse' : pr.status === 'passing' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                    <span className="font-mono text-xs text-[#A1A1A1] flex-shrink-0 w-[52px]">#{pr.number}</span>
                    <span className="font-mono text-sm text-[#E5E5E5] font-medium truncate w-[300px] xl:w-[400px] block">
                        {pr.title}
                    </span>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-[#1A1A1A] text-[#A1A1A1] font-mono text-[10px] flex items-center justify-center">
                            {pr.authorInitials}
                        </div>
                        <span className="font-mono text-xs text-[#A1A1A1]">{pr.author}</span>
                    </div>

                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-full px-2 py-0.5 font-mono text-[10px] text-[#A1A1A1]">
                        {pr.team}
                    </div>

                    <span className="font-mono text-xs text-[#A1A1A1] w-[50px]">{pr.timeAgo}</span>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0 ml-auto mr-4">
                    {pr.status === 'flagged' && (
                        <>
                            <div className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold">
                                {pr.violations.length} violation{pr.violations.length !== 1 ? 's' : ''}
                            </div>
                            <SeverityBadge level="critical" size="xs" />
                        </>
                    )}

                    {pr.status === 'passing' && (
                        <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-green-500">All checks passed</span>
                            <CheckCircle size={14} className="text-green-500" />
                        </div>
                    )}

                    {pr.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-amber-500">Checks running...</span>
                            <Loader2 size={14} className="text-amber-500 animate-spin" />
                        </div>
                    )}

                    {isReviewed && (
                        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-full px-2 py-0.5 font-mono text-[10px] text-[#A1A1A1]">
                            Reviewed
                        </div>
                    )}
                </div>

                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    className="flex-shrink-0 text-[#A1A1A1]"
                >
                    <ChevronDown size={16} />
                </motion.div>
            </div>

            {/* EXPANDED CONTENT */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-t border-[#2A2A2A]"
                    >
                        {pr.status === 'flagged' && (
                            <div>
                                <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                                    <span className="font-mono text-xs uppercase tracking-widest text-[#737373]">Violations</span>
                                    <div
                                        onClick={onOpenDrawer}
                                        className="text-[#6366F1] font-mono text-xs cursor-pointer hover:underline"
                                    >
                                        View full details &rarr;
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    {pr.violations.map(v => (
                                        <ViolationItem
                                            key={v.id}
                                            violation={v}
                                            onAction={onViolationAction}
                                        />
                                    ))}
                                </div>
                                <Footer />
                            </div>
                        )}

                        {pr.status === 'passing' && (
                            <div>
                                <div className="grid grid-cols-3 gap-4 px-5 py-4">
                                    {['API Docs', 'ADR Check', 'Arch Drift', 'Runbook', 'OpenAPI Spec', 'Lint'].map(check => (
                                        <div key={check} className="bg-[#1A1A1A] rounded-xl p-3 text-center flex flex-col items-center">
                                            <CheckCircle size={16} className="text-green-500" />
                                            <span className="font-mono text-xs text-[#A1A1A1] mt-1">{check}</span>
                                        </div>
                                    ))}
                                </div>
                                <Footer />
                            </div>
                        )}

                        {pr.status === 'pending' && (
                            <div className="px-5 py-4 flex items-center gap-3">
                                <Loader2 size={16} className="text-amber-500 animate-spin" />
                                <span className="font-mono text-sm text-[#A1A1A1]">Running {pr.checksRun} checks...</span>
                                <span className="font-mono text-xs text-[#737373] ml-auto">{pr.checksPassed} of {pr.checksRun} complete</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
