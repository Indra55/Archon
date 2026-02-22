import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, Clock as ClockIcon, GitPullRequest, AlertCircle, FileCode } from 'lucide-react';
import { SUGGESTIONS, SCAN_DISCOVERY, CATEGORY_ICONS } from '@/data/selfHealerMockData';
import { SeverityBadge } from '../shared/SeverityBadge';
import { DiffViewer } from './DiffViewer';
import { ResolvedBanner } from './ResolvedBanner';
import { Shield, FileText, Network, Zap, Lock } from 'lucide-react';

const icons: Record<string, React.ElementType> = {
    Shield, FileText, Network, Zap, Lock
};

interface SuggestionDetailDrawerProps {
    suggestionId: string;
    onClose: () => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onDefer: (id: string) => void;
    onNavigate: (path: string) => void;
    undoLastAction: () => void;
}

export function SuggestionDetailDrawer({
    suggestionId, onClose, onApprove, onReject, onDefer, onNavigate, undoLastAction
}: SuggestionDetailDrawerProps) {

    const suggestion = useMemo(() => {
        return [...SUGGESTIONS, SCAN_DISCOVERY].find(s => s.id === suggestionId);
    }, [suggestionId]);

    if (!suggestion) return null;

    const CategoryIcon = icons[CATEGORY_ICONS[suggestion.category]] || Shield;

    const getBorderColor = () => {
        switch (suggestion.severity) {
            case 'critical': return 'border-red-500';
            case 'high': return 'border-amber-500';
            case 'medium': return 'border-yellow-500';
            case 'low': return 'border-blue-400';
        }
    };

    const renderCodeEvidence = () => {
        const lines = suggestion.codeEvidence.split('\n');
        return lines.map((line, i) => {
            const isComment = line.trim().startsWith('// ←');
            return (
                <React.Fragment key={i}>
                    <span className={isComment ? 'text-amber-500' : 'text-secondary'}>{line}</span>
                    {'\n'}
                </React.Fragment>
            );
        });
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black z-30"
            />
            <motion.div
                initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="fixed right-0 top-[56px] w-[480px] bg-surface border-l border-dim z-40 overflow-y-auto flex flex-col"
                style={{ height: 'calc(100vh - 56px)' }}
            >
                <div className="px-6 py-4 border-b border-dim flex items-start gap-3 flex-shrink-0">
                    <div className={`w-[4px] self-stretch ${getBorderColor()} rounded-full`} />
                    <h2 className="font-['Syne'] text-base font-semibold text-primary flex-1 leading-snug">
                        {suggestion.title}
                    </h2>
                    <button onClick={onClose} className="p-1 -mr-1 text-secondary hover:text-primary transition-colors outline-none cursor-pointer">
                        <X size={16} />
                    </button>
                </div>

                <div className="px-6 pb-4 pt-2 border-b border-dim flex items-center gap-2 flex-wrap flex-shrink-0">
                    <SeverityBadge level={suggestion.severity} />
                    <div className="font-mono text-xs text-muted flex items-center gap-1">
                        <CategoryIcon size={12} />
                        <span className="capitalize">{suggestion.category}</span>
                    </div>
                    <div className="bg-elevated rounded-full px-2 py-0.5 font-mono text-[10px] text-secondary">
                        {suggestion.serviceName}
                    </div>
                    {suggestion.relatedIncident && (
                        <div className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-full px-2 py-0.5 font-mono text-[10px] flex items-center gap-1">
                            <AlertCircle size={9} /> {suggestion.relatedIncident}
                        </div>
                    )}
                </div>

                <div className="px-6 py-5 border-b border-dim flex-shrink-0">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">THE PROBLEM</h3>
                    <p className="font-mono text-sm text-primary leading-relaxed">{suggestion.detail}</p>

                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted mt-4 mb-2">WHY THE AI FLAGGED THIS</h3>
                    <p className="font-mono text-xs text-secondary leading-relaxed">{suggestion.rationale}</p>
                </div>

                <div className="px-6 py-5 border-b border-dim flex-shrink-0">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">CODE EVIDENCE</h3>
                    <div className="flex items-center gap-2 mb-3">
                        <FileCode size={12} className="text-muted" />
                        <span className="font-mono text-xs text-accent">{suggestion.codeEvidenceFile}</span>
                    </div>
                    <pre className="bg-base rounded-xl p-4 overflow-x-auto font-mono text-xs leading-[1.6]">
                        {renderCodeEvidence()}
                    </pre>
                </div>

                <div className="px-6 py-5 border-b border-dim flex-shrink-0">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">IMPACT ASSESSMENT</h3>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3 py-2">
                            <TrendingUp size={14} className="text-green-500" />
                            <div className="font-mono text-xs text-secondary flex-1">Health score impact</div>
                            <div className="font-mono text-xs text-green-500 font-medium">+{suggestion.scoreImpact} points</div>
                        </div>
                        <div className="flex items-center gap-3 py-2">
                            <ClockIcon size={14} className="text-muted" />
                            <div className="font-mono text-xs text-secondary flex-1">Manual engineering time saved</div>
                            <div className="font-mono text-xs text-primary font-medium">~{suggestion.estimatedHours} hour{suggestion.estimatedHours === 1 ? '' : 's'}</div>
                        </div>
                        <div className="flex items-center gap-3 py-2">
                            <GitPullRequest size={14} className="text-muted" />
                            <div className="font-mono text-xs text-secondary flex-1">Generated PR</div>
                            <div className="font-mono text-xs text-accent truncate max-w-[150px]">{suggestion.prBranch}</div>
                        </div>
                        {suggestion.relatedIncident && (
                            <div className="flex items-center gap-3 py-2">
                                <AlertCircle size={14} className="text-red-500" />
                                <div className="font-mono text-xs text-secondary flex-1">Related incident</div>
                                <div className="font-mono text-xs text-red-500 font-medium">{suggestion.relatedIncident}</div>
                                <button
                                    onClick={() => onNavigate(`/dashboard/timeline?event=${suggestion.relatedIncident}`)}
                                    className="font-mono text-[10px] text-accent hover:text-accent/80 transition-colors ml-2 outline-none cursor-pointer border-none bg-transparent"
                                >
                                    View in Timeline →
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-5 border-b border-dim flex-shrink-0">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">AFFECTED FILES</h3>
                    <div className="flex flex-col">
                        {suggestion.affectedFiles.map(f => (
                            <div key={f} className="flex items-center gap-2 py-1.5">
                                <FileCode size={12} className="text-muted" />
                                <span className="font-mono text-xs text-secondary">{f}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-6 py-5 border-b border-dim flex-shrink-0">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">FULL DIFF</h3>
                    <DiffViewer
                        original={suggestion.diff.original}
                        modified={suggestion.diff.modified}
                        language={suggestion.diff.language}
                        height={320}
                    />
                </div>

                <div className="sticky bottom-0 border-t border-dim bg-surface mt-auto flex-shrink-0">
                    {suggestion.status === 'pending' ? (
                        <div className="px-6 py-4 flex items-center gap-3">
                            <button
                                onClick={() => onDefer(suggestion.id)}
                                className="border border-dim bg-transparent rounded-lg px-4 py-2 font-mono text-xs text-secondary hover:border-focus hover:text-primary transition-colors outline-none cursor-pointer"
                            >
                                Defer
                            </button>
                            <button
                                onClick={() => onReject(suggestion.id)}
                                className="border border-red-500/30 bg-red-500/5 text-red-500 rounded-lg px-4 py-2 font-mono text-xs hover:bg-red-500/10 hover:border-red-500/50 transition-colors outline-none cursor-pointer"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => onApprove(suggestion.id)}
                                className="ml-auto bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg px-6 py-2.5 font-mono text-xs font-medium hover:bg-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer outline-none"
                            >
                                Approve & Create PR →
                            </button>
                        </div>
                    ) : (
                        <ResolvedBanner
                            status={suggestion.status}
                            prTitle={suggestion.prTitle}
                            prBranch={suggestion.prBranch}
                            undoLastAction={undoLastAction}
                        />
                    )}
                </div>
            </motion.div>
        </>
    );
}
