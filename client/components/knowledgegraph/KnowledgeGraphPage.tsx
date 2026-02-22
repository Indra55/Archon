"use client";

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from './PageHeader';
import { GraphView } from './GraphView';
import { GraphFilterPanel } from './GraphFilterPanel';
import { ServiceDetailDrawer } from './ServiceDetailDrawer';
import { HealthDashboard } from './HealthDashboard';
import { useKnowledgeGraph, ViewMode } from '@/hooks/useKnowledgeGraph';
import { ReactFlowProvider } from '@xyflow/react';

export function KnowledgeGraphPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const kg = useKnowledgeGraph();

    useEffect(() => {
        const highlightParam = searchParams.get('highlight');
        const modeParam = searchParams.get('mode') as ViewMode;

        if (modeParam && ['graph', 'health'].includes(modeParam)) {
            kg.setViewMode(modeParam);
        }

        if (highlightParam) {
            kg.setSpotlightNodeId(highlightParam);

            if (kg.viewMode === 'health' || modeParam === 'health') {
                const row = kg.serviceRowRefs.current[highlightParam];
                if (row) {
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        } else {
            kg.setSpotlightNodeId(null);
        }
    }, [searchParams]);

    return (
        <div className="bg-[#0A0A0A] w-full min-h-[calc(100vh-56px)] overflow-hidden flex flex-col">
            <PageHeader
                viewMode={kg.viewMode}
                onViewModeChange={kg.setViewMode}
            />

            <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                    {kg.viewMode === 'graph' && (
                        <motion.div
                            key="graph"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0"
                        >
                            <ReactFlowProvider>
                                <GraphView
                                    spotlightNodeId={kg.spotlightNodeId}
                                    onNodeClick={kg.openDrawer}
                                    onNodeDoubleClick={(id) => {
                                        router.push(`/dashboard/knowledge-graph?highlight=${id}&mode=health`);
                                    }}
                                    filteredServiceIds={kg.filteredServiceIds}
                                    visibleNodeIds={kg.visibleNodeIds}
                                    isFilterPanelOpen={kg.isFilterPanelOpen}
                                    onToggleFilterPanel={kg.toggleFilterPanel}
                                    isFilterActive={kg.isFilterActive}
                                    apiData={kg.apiData}
                                />
                            </ReactFlowProvider>

                            <AnimatePresence>
                                {kg.isFilterPanelOpen && (
                                    <GraphFilterPanel
                                        searchQuery={kg.searchQuery}
                                        onSearchChange={kg.setSearchQuery}
                                        teamFilters={kg.teamFilters}
                                        onToggleTeam={kg.toggleTeamFilter}
                                        healthFilters={kg.healthFilters}
                                        onToggleHealth={kg.toggleHealthFilter}
                                        typeFilters={kg.typeFilters}
                                        onToggleType={kg.toggleTypeFilter}
                                        isFilterActive={kg.isFilterActive}
                                        onClearAll={kg.clearAllFilters}
                                        onClose={kg.toggleFilterPanel}
                                    />
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {kg.drawerServiceId !== null && (
                                    <ServiceDetailDrawer
                                        serviceId={kg.drawerServiceId}
                                        onClose={kg.closeDrawer}
                                        onNavigate={(path) => router.push(path)}
                                    />
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {kg.viewMode === 'health' && (
                        <motion.div
                            key="health"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 overflow-y-auto"
                        >
                            <HealthDashboard
                                sortKey={kg.sortKey}
                                sortDirection={kg.sortDirection}
                                onSort={kg.setSort}
                                highlightServiceId={kg.spotlightNodeId}
                                onOpenDrawer={kg.openDrawer}
                                onSwitchToGraph={(serviceId) => {
                                    router.push(`/dashboard/knowledge-graph?highlight=${serviceId}&mode=graph`);
                                }}
                                serviceRowRefs={kg.serviceRowRefs}
                                onNavigate={(path) => router.push(path)}
                                viewMode={kg.viewMode}
                            />

                            <AnimatePresence>
                                {kg.drawerServiceId !== null && (
                                    <ServiceDetailDrawer
                                        serviceId={kg.drawerServiceId}
                                        onClose={kg.closeDrawer}
                                        onNavigate={(path) => router.push(path)}
                                    />
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
