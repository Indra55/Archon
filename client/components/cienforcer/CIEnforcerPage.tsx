import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCIEnforcer } from '@/hooks/useCIEnforcer';
import { StatsBar } from './StatsBar';
import { TabBar } from './TabBar';
import { PRFeed } from './PRFeed';
import { PolicyManager } from './PolicyManager';
import { PRDetailDrawer } from './PRDetailDrawer';
import { ActiveTab } from '@/hooks/useCIEnforcer';

export function CIEnforcerPage() {
    const ci = useCIEnforcer();
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (!searchParams) return;

        const prParam = searchParams.get('pr');
        const tabParam = searchParams.get('tab');

        if (tabParam === 'policies' || tabParam === 'feed') {
            ci.setActiveTab(tabParam as ActiveTab);
        }

        if (prParam) {
            const prIdValue = parseInt(prParam, 10);
            const prObj = ci.prs.find(p => p.number === prIdValue);
            if (prObj) {
                ci.setExpandedPRId(prObj.id);
                setTimeout(() => {
                    const el = document.getElementById(`pr-row-${prObj.id}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 200);
            }
        }
    }, [searchParams]);

    return (
        <div className="min-h-[calc(100vh-56px)] bg-[#0A0A0A] text-[#E5E5E5]">
            <StatsBar stats={ci.stats} />

            <TabBar
                activeTab={ci.activeTab}
                onTabChange={ci.setActiveTab}
                flaggedCount={ci.stats.flagged}
            />

            <div className="relative w-full">
                <AnimatePresence mode="wait">
                    {ci.activeTab === 'feed' && (
                        <motion.div
                            key="feed"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div id="feed-container">
                                <PRFeed
                                    prs={ci.filteredPRs}
                                    expandedPRId={ci.expandedPRId}
                                    reviewedPRIds={ci.reviewedPRIds}
                                    onTogglePR={(id) => {
                                        ci.setExpandedPRId(ci.expandedPRId === id ? null : id);
                                    }}
                                    onOpenDrawer={ci.openDrawer}
                                    onMarkReviewed={ci.markReviewed}
                                    onViolationAction={(route) => router.push(route)}
                                    filterStatus={ci.filterStatus}
                                    onFilterStatus={ci.setFilterStatus}
                                    searchQuery={ci.searchQuery}
                                    onSearchQuery={ci.setSearchQuery}
                                    teamFilter={ci.teamFilter}
                                    onTeamFilter={ci.setTeamFilter}
                                    totalCount={ci.prs.length}
                                />
                            </div>
                        </motion.div>
                    )}

                    {ci.activeTab === 'policies' && (
                        <motion.div
                            key="policies"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <PolicyManager
                                policies={ci.policies}
                                onTogglePolicy={ci.togglePolicy}
                                lastSavedPolicyId={ci.lastSavedPolicyId}
                                driftSensitivity={ci.driftSensitivity}
                                onDriftSensitivity={ci.setDriftSensitivity}
                                auditLogEnabled={ci.auditLogEnabled}
                                onToggleAuditLog={ci.toggleAuditLog}
                                onViewAuditPR={(prNum) => {
                                    const prObj = ci.prs.find(p => p.number === prNum);
                                    ci.setActiveTab('feed');
                                    if (prObj) ci.setExpandedPRId(prObj.id);
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {ci.drawerPRId !== null && (
                    <PRDetailDrawer
                        pr={ci.prs.find(p => p.id === ci.drawerPRId)!}
                        isReviewed={ci.reviewedPRIds.has(ci.drawerPRId)}
                        onClose={ci.closeDrawer}
                        onMarkReviewed={() => ci.markReviewed(ci.drawerPRId!)}
                        onViolationAction={(route) => { router.push(route); ci.closeDrawer(); }}
                        onTestScenario={(scenario) => { router.push(`/dashboard/what-if?scenario=${encodeURIComponent(scenario)}`); ci.closeDrawer(); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
