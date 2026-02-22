import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    SuggestionItem, CATEGORY_LABELS, SERVICES_IN_SUGGESTIONS
} from '@/data/selfHealerMockData';
import { FilterStatus } from '@/hooks/useSelfHealer';
import { SuggestionCard } from './SuggestionCard';
import { CheckCircle, Search } from 'lucide-react';

interface SuggestionFeedProps {
    suggestions: SuggestionItem[];
    expandedSuggestionId: string | null;
    highlightedSuggestionId: string | null;
    onToggleExpand: (id: string) => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onDefer: (id: string) => void;
    onOpenDrawer: (id: string) => void;
    undoLastAction: () => void;

    filterStatus: FilterStatus;
    onFilterStatus: (s: FilterStatus) => void;
    filterService: string;
    onFilterService: (s: string) => void;
    filterCategory: string;
    onFilterCategory: (c: string) => void;
    searchQuery: string;
    onSearchQuery: (q: string) => void;
    sortKey: 'severity' | 'service' | 'category' | 'date';
    onSortKey: (k: 'severity' | 'service' | 'category' | 'date') => void;
    onClearFilters: () => void;
    onTriggerScan: () => void;
    totalStats: { pending: number; approved: number; rejected: number; deferred: number; total: number };
}

export function SuggestionFeed({
    suggestions, expandedSuggestionId, highlightedSuggestionId,
    onToggleExpand, onApprove, onReject, onDefer, onOpenDrawer, undoLastAction,
    filterStatus, onFilterStatus, filterService, onFilterService,
    filterCategory, onFilterCategory, searchQuery, onSearchQuery,
    sortKey, onSortKey, onClearFilters, onTriggerScan, totalStats
}: SuggestionFeedProps) {

    useEffect(() => {
        if (highlightedSuggestionId) {
            setTimeout(() => {
                const el = document.getElementById(`suggestion - ${highlightedSuggestionId} `);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        }
    }, [highlightedSuggestionId]);

    const TABS: { id: FilterStatus; label: string; count?: number; color?: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'Pending', count: totalStats.pending, color: 'bg-amber-500/20 text-amber-500' },
        { id: 'approved', label: 'Approved', count: totalStats.approved, color: 'bg-green-500/20 text-green-500' },
        { id: 'rejected', label: 'Rejected', count: totalStats.rejected, color: 'bg-red-500/20 text-red-500' },
        { id: 'deferred', label: 'Deferred', count: totalStats.deferred, color: 'bg-secondary/20 text-secondary' },
    ];

    const hasActiveFilter = filterStatus !== 'all' || filterService !== 'all' || filterCategory !== 'all' || !!searchQuery;
    const isAllResolved = filterStatus === 'all' && totalStats.total > 0 && totalStats.pending === 0;

    return (
        <div className="px-8 py-6">

            <div className="mb-6 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => onFilterStatus(tab.id)}
                            className={`font - mono text - xs px - 3 py - 1.5 rounded - lg cursor - pointer transition - colors flex items - center gap - 1.5 ${filterStatus === tab.id ? 'bg-elevated text-primary border border-dim' : 'text-secondary hover:bg-elevated/50 bg-transparent border border-transparent'} `}
                        >
                            {tab.label}
                            {tab.id !== 'all' && tab.count! > 0 && (
                                <span className={`px - 1.5 py - 0.5 rounded - full text - [9px] ${tab.color} `}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex gap-1.5 ml-4">
                    <button
                        onClick={() => onFilterCategory('all')}
                        className={`font - mono text - [10px] px - 2.5 py - 1 rounded - full cursor - pointer transition - colors ${filterCategory === 'all' ? 'bg-elevated border border-dim text-primary' : 'text-muted hover:text-secondary bg-transparent border border-transparent'} `}
                    >
                        All
                    </button>
                    {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                        <button
                            key={k}
                            onClick={() => onFilterCategory(k)}
                            className={`font - mono text - [10px] px - 2.5 py - 1 rounded - full cursor - pointer transition - colors ${filterCategory === k ? 'bg-elevated border border-dim text-primary' : 'text-muted hover:text-secondary bg-transparent border border-transparent'} `}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <select
                        className="bg-surface border border-dim rounded-lg px-3 py-1.5 font-mono text-xs text-secondary outline-none appearance-none cursor-pointer"
                        value={filterService}
                        onChange={e => onFilterService(e.target.value)}
                    >
                        {SERVICES_IN_SUGGESTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>

                    <select
                        className="bg-surface border border-dim rounded-lg px-3 py-1.5 font-mono text-xs text-secondary outline-none appearance-none cursor-pointer"
                        value={sortKey}
                        onChange={e => onSortKey(e.target.value as any)}
                    >
                        <option value="severity">By Severity</option>
                        <option value="service">By Service</option>
                        <option value="category">By Category</option>
                        <option value="date">By Date</option>
                    </select>

                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search suggestions..."
                            value={searchQuery}
                            onChange={e => onSearchQuery(e.target.value)}
                            className="bg-surface border border-dim rounded-lg pl-8 pr-3 py-1.5 font-mono text-xs text-primary placeholder-muted outline-none focus:border-focus w-[200px]"
                        />
                    </div>
                </div>
            </div>

            <div className="mb-4 font-mono text-xs text-muted">
                Showing {suggestions.length} suggestion{suggestions.length === 1 ? '' : 's'}
                {hasActiveFilter ? ' · filtered' : ''}
            </div>

            <div className="relative">
                <AnimatePresence mode="popLayout">
                    {suggestions.map(sugg => (
                        <div id={`suggestion - ${sugg.id} `} key={sugg.id}>
                            <SuggestionCard
                                suggestion={sugg}
                                isExpanded={expandedSuggestionId === sugg.id}
                                isHighlighted={highlightedSuggestionId === sugg.id}
                                onToggleExpand={() => onToggleExpand(sugg.id)}
                                onApprove={() => onApprove(sugg.id)}
                                onReject={() => onReject(sugg.id)}
                                onDefer={() => onDefer(sugg.id)}
                                onOpenDrawer={() => onOpenDrawer(sugg.id)}
                                undoLastAction={undoLastAction}
                            />
                        </div>
                    ))}

                    {suggestions.length === 0 && !isAllResolved && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-24"
                        >
                            <CheckCircle size={36} className="text-green-500 mb-3" />
                            <h2 className="font-['Syne'] text-base font-semibold text-secondary">No suggestions match your filters</h2>
                            <p className="font-mono text-xs text-muted mt-1">Try adjusting the status or category filter.</p>
                            <button
                                onClick={onClearFilters}
                                className="text-accent font-mono text-xs mt-3 cursor-pointer hover:underline outline-none"
                            >
                                Clear filters
                            </button>
                        </motion.div>
                    )}

                    {suggestions.length === 0 && isAllResolved && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-24"
                        >
                            <CheckCircle size={40} className="text-green-500 mb-3" />
                            <h2 className="font-['Syne'] text-lg font-bold text-green-500">All suggestions resolved</h2>
                            <p className="font-mono text-sm text-secondary mt-2 text-center max-w-[360px]">
                                The system is operating at peak health. Run a new scan for fresh patterns.
                            </p>
                            <button
                                onClick={onTriggerScan}
                                className="bg-accent text-white rounded-xl px-5 py-2.5 flex items-center gap-2 font-mono text-sm font-medium hover:bg-accent/90 transition-colors mt-4 outline-none cursor-pointer"
                            >
                                Run Scan
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </div>
    );
}
