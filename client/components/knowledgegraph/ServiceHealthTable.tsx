import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowUp, ArrowDown, ExternalLink, BookOpen, Terminal, MoreHorizontal } from 'lucide-react';
import { SERVICES, ServiceDefinition } from '@/data/knowledgeGraphMockData';
import { HealthBar } from '../shared/HealthBar';
import { SortKey } from '@/hooks/useKnowledgeGraph';

interface ServiceHealthTableProps {
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

export function ServiceHealthTable({
    sortKey,
    sortDirection,
    onSort,
    highlightServiceId,
    onOpenDrawer,
    onSwitchToGraph,
    serviceRowRefs,
    onNavigate,
    viewMode
}: ServiceHealthTableProps) {
    const [tableSearch, setTableSearch] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const filteredServices = SERVICES.filter(s =>
        !tableSearch || s.name.toLowerCase().includes(tableSearch.toLowerCase()) || s.id.toLowerCase().includes(tableSearch.toLowerCase())
    );

    const sortedServices = [...filteredServices].sort((a, b) => {
        let comparison = 0;
        switch (sortKey) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'health':
                comparison = a.health.localeCompare(b.health);
                break;
            case 'docCoverage':
                comparison = a.docCoverage - b.docCoverage;
                break;
            case 'lastUpdated':
                comparison = a.lastUpdatedDays - b.lastUpdatedDays;
                break;
            case 'missingCount':
                comparison = a.missingArtifacts.length - b.missingArtifacts.length;
                break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    const inferTemplate = (artifact: string) => {
        if (artifact.toLowerCase().includes('runbook')) return 'runbook';
        if (artifact.toLowerCase().startsWith('adr')) return 'adr';
        return 'api';
    };

    return (
        <div className="bg-[#111] border border-[#2A2A2A] rounded-2xl overflow-hidden flex flex-col h-full relative">
            <div className="px-5 py-4 border-b border-[#2A2A2A] flex items-center justify-between shadow-sm z-10">
                <h2 className="font-['Syne'] text-sm font-semibold text-[#E5E5E5]">Service Health</h2>
                <div className="relative w-[200px]">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={tableSearch}
                        onChange={e => setTableSearch(e.target.value)}
                        className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-1.5 pl-8 w-full font-mono text-xs text-[#E5E5E5] outline-none focus:border-[#6366F1] transition-colors"
                    />
                </div>
            </div>

            <div className="bg-[#1A1A1A] px-5 py-2.5 border-b border-[#2A2A2A] flex text-[#737373] font-mono text-[10px] uppercase tracking-widest z-10 sticky top-0">
                <button onClick={() => onSort('name')} className="flex-1 flex items-center hover:text-[#E5E5E5] transition-colors text-left uppercase">
                    SERVICE {sortKey === 'name' && (sortDirection === 'asc' ? <ArrowUp size={10} className="ml-1 text-[#E5E5E5]" /> : <ArrowDown size={10} className="ml-1 text-[#E5E5E5]" />)}
                </button>
                <div className="w-[80px]">TEAM</div>
                <button onClick={() => onSort('docCoverage')} className="w-[160px] flex items-center hover:text-[#E5E5E5] transition-colors text-left uppercase">
                    DOC COVERAGE {sortKey === 'docCoverage' && (sortDirection === 'asc' ? <ArrowUp size={10} className="ml-1 text-[#E5E5E5]" /> : <ArrowDown size={10} className="ml-1 text-[#E5E5E5]" />)}
                </button>
                <button onClick={() => onSort('missingCount')} className="w-[80px] flex items-center hover:text-[#E5E5E5] transition-colors text-left uppercase">
                    MISSING {sortKey === 'missingCount' && (sortDirection === 'asc' ? <ArrowUp size={10} className="ml-1 text-[#E5E5E5]" /> : <ArrowDown size={10} className="ml-1 text-[#E5E5E5]" />)}
                </button>
                <button onClick={() => onSort('lastUpdated')} className="w-[90px] flex items-center hover:text-[#E5E5E5] transition-colors text-left uppercase">
                    UPDATED {sortKey === 'lastUpdated' && (sortDirection === 'asc' ? <ArrowUp size={10} className="ml-1 text-[#E5E5E5]" /> : <ArrowDown size={10} className="ml-1 text-[#E5E5E5]" />)}
                </button>
                <div className="w-[100px] text-right pr-2">ACTIONS</div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                {sortedServices.map(service => {
                    const isHighlighted = viewMode === 'health' && highlightServiceId === service.id;

                    return (
                        <div
                            key={service.id}
                            ref={el => { serviceRowRefs.current[service.id] = el }}
                            className={`px-5 py-3.5 border-b border-[#2A2A2A] last:border-0 flex items-center hover:bg-[#1A1A1A]/30 transition-colors duration-120 group relative ${isHighlighted ? 'bg-[#1A1A1A]/50 border border-[#6366F1] shadow-[0_0_0_1px_#6366F1] animate-pulse z-10' : ''}`}
                            style={isHighlighted ? { animationIterationCount: 2 } : {}}
                        >
                            <div className="flex-1 flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${service.health === 'healthy' ? 'bg-green-500' :
                                        service.health === 'stale' ? 'bg-amber-500' :
                                            'bg-red-500'
                                    }`} />
                                <button
                                    onClick={() => onOpenDrawer(service.id)}
                                    className="font-mono text-sm text-[#E5E5E5] font-medium hover:underline text-left truncate"
                                >
                                    {service.name}
                                </button>
                            </div>

                            <div className="w-[80px]">
                                <span className="bg-[#1A1A1A] rounded-full px-2 py-0.5 font-mono text-[10px] text-[#A1A1A1] truncate inline-block w-full">
                                    {service.team}
                                </span>
                            </div>

                            <div className="w-[160px] flex items-center gap-2 pr-4">
                                <HealthBar value={service.docCoverage} height={4} showLabel={false} animateOnMount={true} />
                                <span className="font-mono text-xs text-[#737373] w-[28px] text-right">{service.docCoverage}%</span>
                            </div>

                            <div className="w-[80px] flex gap-1">
                                {service.missingArtifacts.map((art, i) => {
                                    let Icon = ExternalLink;
                                    if (art.toLowerCase().includes('api')) Icon = ExternalLink;
                                    else if (art.toLowerCase().includes('adr')) Icon = BookOpen;
                                    else if (art.toLowerCase().includes('runbook')) Icon = Terminal;

                                    return (
                                        <div key={i} title={art} className="relative group/tooltip">
                                            <Icon size={12} className="text-red-500" />
                                            <div className="absolute opacity-0 group-hover/tooltip:opacity-100 transition-opacity bg-[#1A1A1A] text-[#A1A1A1] text-[10px] px-2 py-1 rounded -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none border border-[#2A2A2A] z-50">
                                                {art}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="w-[90px]">
                                <span className={`font-mono text-xs ${service.lastUpdatedDays > 14 ? 'text-red-500' : service.lastUpdatedDays > 7 ? 'text-amber-500' : 'text-[#737373]'}`}>
                                    {service.lastUpdatedDays}d ago
                                </span>
                            </div>

                            <div className="w-[100px] text-right pr-2 relative">
                                <button
                                    onClick={() => setOpenDropdownId(openDropdownId === service.id ? null : service.id)}
                                    className="p-1 hover:bg-[#1A1A1A] rounded text-[#A1A1A1] transition-colors"
                                >
                                    <MoreHorizontal size={14} />
                                </button>

                                <AnimatePresence>
                                    {openDropdownId === service.id && (
                                        <div className="absolute right-6 top-6 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-xl overflow-hidden z-[100] w-48 text-left py-1" onMouseLeave={() => setOpenDropdownId(null)}>
                                            <button
                                                onClick={() => { onNavigate(`/dashboard/doc-generator?service=${service.id}`); setOpenDropdownId(null); }}
                                                className="w-full px-4 py-2.5 font-mono text-xs text-[#E5E5E5] hover:bg-[#111] transition-colors text-left"
                                            >
                                                Fix with AI
                                            </button>
                                            <button
                                                onClick={() => { onSwitchToGraph(service.id); setOpenDropdownId(null); }}
                                                className="w-full px-4 py-2.5 font-mono text-xs text-[#E5E5E5] hover:bg-[#111] transition-colors text-left"
                                            >
                                                Open in Graph
                                            </button>
                                            <button
                                                onClick={() => { onNavigate(`/dashboard/what-if?scenario=What happens if ${service.name} goes down`); setOpenDropdownId(null); }}
                                                className="w-full px-4 py-2.5 font-mono text-xs text-[#E5E5E5] hover:bg-[#111] transition-colors text-left"
                                            >
                                                Analyze in What-If
                                            </button>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="px-5 py-3 border-t border-[#2A2A2A] font-mono text-xs text-[#737373] mt-auto flex-shrink-0 z-10 bg-[#111]">
                Showing {sortedServices.length} services · sorted by {sortKey}
            </div>
        </div>
    );
}
