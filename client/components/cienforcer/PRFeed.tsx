import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Inbox } from 'lucide-react';
import { PRItem, TEAMS } from '@/data/ciEnforcerMockData';
import { FilterStatus } from '@/hooks/useCIEnforcer';
import { PRRow } from './PRRow';

interface PRFeedProps {
    prs: PRItem[];
    expandedPRId: number | null;
    reviewedPRIds: Set<number>;
    onTogglePR: (id: number) => void;
    onOpenDrawer: (id: number) => void;
    onMarkReviewed: (id: number) => void;
    onViolationAction: (route: string) => void;
    filterStatus: FilterStatus;
    onFilterStatus: (status: FilterStatus) => void;
    searchQuery: string;
    onSearchQuery: (query: string) => void;
    teamFilter: string;
    onTeamFilter: (team: string) => void;
    totalCount: number;
}

const STATUS_TABS: FilterStatus[] = ['all', 'flagged', 'passing', 'pending'];

export function PRFeed({
    prs,
    expandedPRId,
    reviewedPRIds,
    onTogglePR,
    onOpenDrawer,
    onMarkReviewed,
    onViolationAction,
    filterStatus,
    onFilterStatus,
    searchQuery,
    onSearchQuery,
    teamFilter,
    onTeamFilter,
    totalCount
}: PRFeedProps) {

    const hasActiveFilters = filterStatus !== 'all' || searchQuery || teamFilter !== 'All Teams';

    return (
        <div className="px-8 py-6">
            {/* FILTER ROW */}
            <div className="mb-4 flex items-center gap-3 flex-wrap">
                <div className="flex gap-1">
                    {STATUS_TABS.map(status => (
                        <div
                            key={status}
                            onClick={() => onFilterStatus(status)}
                            className={`font-mono text-xs px-3 py-1.5 rounded-lg cursor-pointer capitalize transition-colors ${filterStatus === status
                                ? 'bg-[#1A1A1A] text-[#E5E5E5] border border-[#2A2A2A]'
                                : 'text-[#A1A1A1] hover:bg-[#1A1A1A]/50 border border-transparent'
                                }`}
                        >
                            {status}
                        </div>
                    ))}
                </div>

                <div className="ml-4 flex-1 max-w-[280px] bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-1.5 flex items-center gap-2 focus-within:border-[#6366F1] transition-colors">
                    <Search size={12} className="text-[#A1A1A1]" />
                    <input
                        type="text"
                        placeholder="Search PRs by title or number..."
                        value={searchQuery}
                        onChange={(e) => onSearchQuery(e.target.value)}
                        className="font-mono text-xs text-[#E5E5E5] bg-transparent outline-none flex-1 placeholder-[#737373]"
                    />
                </div>

                <div className="ml-auto relative">
                    <select
                        value={teamFilter}
                        onChange={(e) => onTeamFilter(e.target.value)}
                        className="appearance-none bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-1.5 pr-7 font-mono text-xs text-[#A1A1A1] cursor-pointer outline-none focus:border-[#6366F1] transition-colors"
                    >
                        {TEAMS.map(team => (
                            <option key={team} value={team}>{team}</option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A1A1] pointer-events-none" />
                </div>
            </div>

            {hasActiveFilters && (
                <div className="mb-4 font-mono text-xs text-[#737373]">
                    Showing {prs.length} of {totalCount} PRs
                    {filterStatus !== 'all' && ` · ${filterStatus}`}
                    {searchQuery && ` · matching '${searchQuery}'`}
                </div>
            )}

            {/* PR LIST */}
            <div className="flex flex-col relative w-full">
                {prs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Inbox size={32} className="text-[#A1A1A1]" />
                        <h3 className="font-['Syne'] text-base font-semibold text-[#A1A1A1] mt-3">No PRs match your filters</h3>
                        <p className="font-mono text-xs text-[#737373] mt-1">Try adjusting the status or team filter.</p>
                        <button
                            onClick={() => {
                                onFilterStatus('all');
                                onSearchQuery('');
                                onTeamFilter('All Teams');
                            }}
                            className="text-[#6366F1] font-mono text-xs mt-3 hover:underline"
                        >
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <AnimatePresence>
                        {prs.map(pr => (
                            <motion.div
                                layout
                                key={pr.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <PRRow
                                    pr={pr}
                                    isExpanded={expandedPRId === pr.id}
                                    isReviewed={reviewedPRIds.has(pr.id)}
                                    onToggle={() => onTogglePR(pr.id)}
                                    onOpenDrawer={() => onOpenDrawer(pr.id)}
                                    onMarkReviewed={() => onMarkReviewed(pr.id)}
                                    onViolationAction={onViolationAction}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
