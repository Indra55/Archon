'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useSelfHealer } from '@/hooks/useSelfHealer';
import { SelfHealerHeader } from './SelfHealerHeader';
import { ScanProgressBar } from './ScanProgressBar';
import { SuggestionFeed } from './SuggestionFeed';
import { SuggestionDetailDrawer } from './SuggestionDetailDrawer';
import { ToastNotification } from './ToastNotification';

function SelfHealerContent() {
    const sh = useSelfHealer();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [highlightedSuggestionId, setHighlightedSuggestionId] = useState<string | null>(null);

    useEffect(() => {
        const suggestionParam = searchParams.get('suggestion');
        const serviceParam = searchParams.get('service');

        if (suggestionParam) {
            sh.setExpandedSuggestionId(suggestionParam);
            setHighlightedSuggestionId(suggestionParam);

            const timer = setTimeout(() => {
                setHighlightedSuggestionId(null);
            }, 3000);

            return () => clearTimeout(timer);
        }

        if (serviceParam) {
            sh.setFilterService(serviceParam);
        }
    }, [searchParams]);

    return (
        <div className="min-h-[calc(100vh-56px)] bg-base flex flex-col relative w-full">
            <SelfHealerHeader
                healthScore={sh.healthScore}
                previousHealthScore={sh.previousHealthScore}
                isScoreAnimating={sh.isScoreAnimating}
                stats={sh.stats}
                isScanning={sh.isScanning}
                onScan={sh.triggerScan}
                canUndo={sh.canUndo}
                onUndo={sh.undoLastAction}
            />

            <AnimatePresence>
                {sh.isScanning && (
                    <ScanProgressBar scanProgress={sh.scanProgress} />
                )}
            </AnimatePresence>

            <div className="flex-1 overflow-x-hidden">
                <SuggestionFeed
                    suggestions={sh.filteredSuggestions}
                    expandedSuggestionId={sh.expandedSuggestionId}
                    highlightedSuggestionId={highlightedSuggestionId}
                    onToggleExpand={(id: string) =>
                        sh.setExpandedSuggestionId(
                            sh.expandedSuggestionId === id ? null : id
                        )
                    }
                    onApprove={sh.approveSuggestion}
                    onReject={sh.rejectSuggestion}
                    onDefer={sh.deferSuggestion}
                    onOpenDrawer={sh.openDrawer}
                    filterStatus={sh.filterStatus}
                    onFilterStatus={sh.setFilterStatus}
                    filterService={sh.filterService}
                    onFilterService={sh.setFilterService}
                    filterCategory={sh.filterCategory as any}
                    onFilterCategory={sh.setFilterCategory as any}
                    searchQuery={sh.searchQuery}
                    onSearchQuery={sh.setSearchQuery}
                    sortKey={sh.sortKey}
                    onSortKey={sh.setSortKey}
                    onClearFilters={() => {
                        sh.setFilterStatus('all');
                        sh.setFilterService('all');
                        sh.setFilterCategory('all');
                        sh.setSearchQuery('');
                    }}
                    onTriggerScan={sh.triggerScan}
                    totalStats={sh.stats}
                    undoLastAction={sh.undoLastAction}
                />
            </div>

            <AnimatePresence>
                {sh.drawerSuggestionId !== null && (
                    <SuggestionDetailDrawer
                        suggestionId={sh.drawerSuggestionId}
                        onClose={sh.closeDrawer}
                        onApprove={(id: string) => { sh.approveSuggestion(id); sh.closeDrawer(); }}
                        onReject={(id: string) => { sh.rejectSuggestion(id); sh.closeDrawer(); }}
                        onDefer={(id: string) => { sh.deferSuggestion(id); sh.closeDrawer(); }}
                        onNavigate={router.push}
                        undoLastAction={sh.undoLastAction}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {sh.activeToast !== null && (
                    <ToastNotification
                        toast={sh.activeToast}
                        onDismiss={sh.dismissToast}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export function SelfHealerPage() {
    return (
        <Suspense fallback={<div className="min-h-[calc(100vh-56px)] bg-base w-full flex items-center justify-center font-mono text-sm text-muted">Loading...</div>}>
            <SelfHealerContent />
        </Suspense>
    );
}
