import React from 'react';
import { Network, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';
import { DashboardStatCard } from './DashboardStatCard';
import { ServiceHealthTable } from './ServiceHealthTable';
import { CoverageTrendChart } from './CoverageTrendChart';
import { RECENT_GRAPH_ACTIVITY } from '@/data/knowledgeGraphMockData';
import { SortKey } from '@/hooks/useKnowledgeGraph';

interface HealthDashboardProps {
    sortKey: SortKey;
    sortDirection: 'asc' | 'desc';
    onSort: (key: SortKey) => void;
    highlightServiceId: string | null;
    onOpenDrawer: (id: string) => void;
    onSwitchToGraph: (id: string) => void;
    serviceRowRefs: React.MutableRefObject<Record<string, HTMLTableRowElement | null>>;
    onNavigate: (path: string) => void;
    viewMode: 'health' | 'graph';
}

export function HealthDashboard({
    sortKey,
    sortDirection,
    onSort,
    highlightServiceId,
    onOpenDrawer,
    onSwitchToGraph,
    serviceRowRefs,
    onNavigate,
    viewMode,
}: HealthDashboardProps) {
    return (
        <div className="px-8 py-6 bg-[#0A0A0A] min-h-full">
            <div className="grid grid-cols-4 gap-4 mb-6">
                <DashboardStatCard
                    label="SERVICES"
                    value={6}
                    icon={Network}
                    delta="1 undocumented"
                    deltaPositive={false}
                />
                <DashboardStatCard
                    label="AVG DOC COVERAGE"
                    value={67}
                    unit="%"
                    icon={FileText}
                    delta="+2% vs last week"
                    deltaPositive={true}
                />
                <DashboardStatCard
                    label="MISSING ARTIFACTS"
                    value={9}
                    icon={AlertTriangle}
                    delta="across 4 services"
                    deltaPositive={false}
                />
                <DashboardStatCard
                    label="OPEN INCIDENTS"
                    value={0}
                    icon={ShieldCheck}
                    delta="all clear"
                    deltaPositive={true}
                />
            </div>

            <div className="grid grid-cols-[1fr_300px] gap-6" style={{ height: 'calc(100vh - 56px - 64px - 140px - 48px)' }}>
                <ServiceHealthTable
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    highlightServiceId={highlightServiceId}
                    onOpenDrawer={onOpenDrawer}
                    onSwitchToGraph={onSwitchToGraph}
                    serviceRowRefs={serviceRowRefs}
                    onNavigate={onNavigate}
                    viewMode={viewMode}
                />

                <div className="bg-[#111] border border-[#2A2A2A] rounded-2xl p-5 flex flex-col h-full overflow-hidden">
                    <CoverageTrendChart />

                    <div className="mt-5 border-t border-[#2A2A2A] pt-4 flex-1 overflow-y-auto min-h-0">
                        <h3 className="font-mono text-xs uppercase tracking-widest text-[#737373] mb-3">Recent Changes</h3>

                        <div className="flex flex-col">
                            {RECENT_GRAPH_ACTIVITY.map((activity, index) => (
                                <div
                                    key={activity.id}
                                    onClick={() => onNavigate(`/dashboard/knowledge-graph?highlight=${activity.serviceId}`)}
                                    className={`py-2.5 flex items-start gap-2 cursor-pointer hover:bg-[#1A1A1A]/30 transition-colors ${index !== RECENT_GRAPH_ACTIVITY.length - 1 ? 'border-b border-[#2A2A2A]' : ''}`}
                                >
                                    <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${activity.type === 'added' ? 'bg-green-500' :
                                            activity.type === 'updated' ? 'bg-[#6366F1]' :
                                                activity.type === 'stale' ? 'bg-amber-500' :
                                                    'bg-red-500'
                                        }`} />
                                    <span className="font-mono text-xs text-[#A1A1A1] leading-snug flex-1 group-hover:text-[#E5E5E5]">
                                        {activity.text}
                                    </span>
                                    <span className="font-mono text-[10px] text-[#737373] flex-shrink-0 mt-0.5">
                                        {activity.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
