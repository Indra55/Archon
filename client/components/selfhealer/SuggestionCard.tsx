import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SuggestionItem, CATEGORY_ICONS } from '@/data/selfHealerMockData';
import { DiffViewer } from './DiffViewer';
import { ActionBar } from './ActionBar';
import { ResolvedBanner } from './ResolvedBanner';
import { SeverityBadge } from '../shared/SeverityBadge';
import { Shield, FileText, Network, Zap, Lock, AlertCircle, TrendingUp, Clock as ClockIcon, ChevronDown, CheckCircle, XCircle, FileCode } from 'lucide-react';

const icons: Record<string, React.ElementType> = {
    Shield, FileText, Network, Zap, Lock
};

interface SuggestionCardProps {
    suggestion: SuggestionItem;
    isExpanded: boolean;
    isHighlighted: boolean;
    onToggleExpand: () => void;
    onApprove: () => void;
    onReject: () => void;
    onDefer: () => void;
    onOpenDrawer: () => void;
    undoLastAction: () => void;
}

export function SuggestionCard({
    suggestion, isExpanded, isHighlighted,
    onToggleExpand, onApprove, onReject, onDefer, onOpenDrawer, undoLastAction
}: SuggestionCardProps) {

    const CategoryIcon = icons[CATEGORY_ICONS[suggestion.category]] || Shield;

    const getLeftBorder = () => {
        switch (suggestion.status) {
            case 'pending': return 'border-l-amber-500';
            case 'approved': return 'border-l-green-500';
            case 'rejected': return 'border-l-red-500/40';
            case 'deferred': return 'border-l-dim';
        }
    };

    const getStatusBadge = () => {
        switch (suggestion.status) {
            case 'approved':
                return (
                    <div className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-full px-2.5 py-1 font-mono text-xs flex items-center gap-1">
                        <CheckCircle size={12} /> Approved
                    </div>
                );
            case 'rejected':
                return (
                    <div className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-full px-2.5 py-1 font-mono text-xs flex items-center gap-1">
                        <XCircle size={12} /> Rejected
                    </div>
                );
            case 'deferred':
                return (
                    <div className="bg-elevated text-secondary border border-dim rounded-full px-2.5 py-1 font-mono text-xs flex items-center gap-1">
                        <ClockIcon size={12} /> Deferred
                    </div>
                );
            default: return null;
        }
    };

    return (
        <motion.div
            layout
            className={`bg-surface border border-dim rounded-2xl mb-4 overflow-hidden outline-none transition-colors border-l-[4px] ${getLeftBorder()} ${isHighlighted ? 'border-amber-500/50 relative shadow-[0_0_0_3px_rgba(245,158,11,0.2)]' : ''}`}
            animate={isHighlighted ? { boxShadow: ['0 0 0 3px rgba(245,158,11,0.2)', '0 0 0 0px rgba(245,158,11,0)', '0 0 0 3px rgba(245,158,11,0.2)'] } : {}}
            transition={isHighlighted ? { duration: 1, repeat: 2 } : {}}
        >
            <div className="px-5 py-4 flex items-start gap-4">
                <div className="w-[40px] h-[40px] rounded-full bg-elevated border border-dim flex items-center justify-center flex-shrink-0">
                    <CategoryIcon size={16} className="text-secondary" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-mono text-sm text-primary font-semibold">{suggestion.title}</h3>
                        <SeverityBadge level={suggestion.severity} />
                        {suggestion.relatedIncident && (
                            <div className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-full px-2 py-0.5 font-mono text-[10px] flex items-center gap-1">
                                <AlertCircle size={9} /> {suggestion.relatedIncident}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                        <div className="bg-elevated rounded-full px-2 py-0.5 font-mono text-[10px] text-secondary">
                            {suggestion.serviceName}
                        </div>
                        <div className="font-mono text-[10px] text-muted capitalize">{suggestion.category}</div>
                        <div className="font-mono text-[10px] text-muted">·</div>
                        <div className="font-mono text-[10px] text-muted">Detected {suggestion.detectedAt}</div>
                    </div>

                    <p className="mt-2 font-mono text-xs text-secondary leading-relaxed max-w-3xl">
                        {suggestion.detail}
                    </p>

                    <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <TrendingUp size={11} className="text-green-500" />
                            <span className="font-mono text-[10px] text-green-500">+{suggestion.scoreImpact} pts if approved</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <ClockIcon size={11} className="text-muted" />
                            <span className="font-mono text-[10px] text-muted">~{suggestion.estimatedHours}hr saved</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {getStatusBadge()}

                    {suggestion.status === 'pending' && (
                        <button
                            onClick={onToggleExpand}
                            className="border border-dim rounded-lg px-3 py-1.5 font-mono text-xs text-secondary hover:text-primary transition-colors cursor-pointer outline-none flex items-center gap-1.5"
                        >
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                <ChevronDown size={12} />
                            </motion.div>
                            {isExpanded ? 'Hide diff' : 'View diff'}
                        </button>
                    )}

                    <button
                        onClick={onOpenDrawer}
                        className="font-mono text-[10px] text-accent hover:text-accent/80 transition-colors cursor-pointer outline-none mt-1"
                    >
                        Details →
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="px-5 pt-2 pb-3 border-t border-dim flex items-center justify-between">
                            <div className="flex gap-2 flex-wrap">
                                {suggestion.affectedFiles.map(file => (
                                    <div key={file} className="bg-elevated rounded px-2 py-0.5 font-mono text-[10px] text-secondary flex items-center gap-1">
                                        <FileCode size={9} />
                                        {file}
                                    </div>
                                ))}
                            </div>
                            <span className="font-mono text-[10px] text-muted">
                                {suggestion.affectedFiles.length} file{suggestion.affectedFiles.length === 1 ? '' : 's'} changed
                            </span>
                        </div>

                        <DiffViewer
                            original={suggestion.diff.original}
                            modified={suggestion.diff.modified}
                            language={suggestion.diff.language}
                            height={240}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <ActionBar
                status={suggestion.status}
                onOpenDrawer={onOpenDrawer}
                onApprove={onApprove}
                onReject={onReject}
                onDefer={onDefer}
            />

            <ResolvedBanner
                status={suggestion.status}
                prTitle={suggestion.prTitle}
                prBranch={suggestion.prBranch}
                undoLastAction={undoLastAction}
            />

        </motion.div>
    );
}
