import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Search, Check } from 'lucide-react';
import { TEAMS, HealthStatus, ServiceType } from '@/hooks/useKnowledgeGraph';
import { TEAMS as MOCK_TEAMS } from '@/data/knowledgeGraphMockData';

interface FilterCheckboxProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    dotColor?: string;
}

function FilterCheckbox({ label, isActive, onClick, dotColor }: FilterCheckboxProps) {
    return (
        <div onClick={onClick} className="flex items-center gap-2.5 cursor-pointer py-1.5 px-4 hover:bg-[#1A1A1A]/30 transition-colors group">
            <div className={`w-[14px] h-[14px] flex items-center justify-center rounded transition-colors duration-150 border ${isActive ? 'bg-[#6366F1] border-[#6366F1]' : 'bg-[#1A1A1A] border-[#2A2A2A]'}`}>
                {isActive && <Check size={10} className="text-white" />}
            </div>
            <span className={`font-mono text-xs ${isActive ? 'text-[#E5E5E5]' : 'text-[#A1A1A1] group-hover:text-[#E5E5E5]'}`}>{label}</span>
            {dotColor && <div className={`w-[6px] h-[6px] rounded-full ml-auto ${dotColor}`} />}
        </div>
    );
}

interface GraphFilterPanelProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    teamFilters: string[];
    onToggleTeam: (team: string) => void;
    healthFilters: HealthStatus[];
    onToggleHealth: (s: HealthStatus) => void;
    typeFilters: ServiceType[];
    onToggleType: (t: ServiceType) => void;
    isFilterActive: boolean;
    onClearAll: () => void;
    onClose: () => void;
}

export function GraphFilterPanel({
    searchQuery,
    onSearchChange,
    teamFilters,
    onToggleTeam,
    healthFilters,
    onToggleHealth,
    typeFilters,
    onToggleType,
    isFilterActive,
    onClearAll,
    onClose
}: GraphFilterPanelProps) {

    const TEAMS_LIST = MOCK_TEAMS.filter(t => t !== 'All Teams');

    return (
        <motion.div
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-0 h-full w-[260px] bg-[#111]/95 backdrop-blur-md border-r border-[#2A2A2A] z-20 flex flex-col overflow-y-auto"
        >
            <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center shadow-sm">
                <SlidersHorizontal size={14} className="text-[#737373]" />
                <h2 className="font-['Syne'] text-sm font-semibold text-[#E5E5E5] ml-2 flex-1">Filters</h2>
                {isFilterActive && (
                    <button onClick={onClearAll} className="font-mono text-xs text-[#6366F1] hover:underline mr-4">
                        Clear all
                    </button>
                )}
                <button onClick={onClose} className="text-[#A1A1A1] hover:text-[#E5E5E5] transition-colors">
                    <X size={16} />
                </button>
            </div>

            <div className="px-4 py-3 border-b border-[#2A2A2A] relative">
                <Search size={12} className="absolute left-7 top-1/2 -translate-y-1/2 text-[#737373]" />
                <input
                    type="text"
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 w-full pl-8 font-mono text-xs text-[#E5E5E5] outline-none focus:border-[#6366F1] transition-colors"
                />
            </div>

            <div className="flex-col">
                {/* TEAM FILTER */}
                <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#737373] px-4 pt-4 pb-2">TEAM</div>
                    {TEAMS_LIST.map(team => (
                        <FilterCheckbox
                            key={team}
                            label={team}
                            isActive={teamFilters.includes(team)}
                            onClick={() => onToggleTeam(team)}
                        />
                    ))}
                </div>

                {/* HEALTH FILTER */}
                <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#737373] px-4 pt-4 pb-2">HEALTH STATUS</div>
                    <FilterCheckbox
                        label="Healthy"
                        isActive={healthFilters.includes('healthy')}
                        onClick={() => onToggleHealth('healthy')}
                        dotColor="bg-green-500"
                    />
                    <FilterCheckbox
                        label="Stale"
                        isActive={healthFilters.includes('stale')}
                        onClick={() => onToggleHealth('stale')}
                        dotColor="bg-amber-500"
                    />
                    <FilterCheckbox
                        label="Undocumented"
                        isActive={healthFilters.includes('undocumented')}
                        onClick={() => onToggleHealth('undocumented')}
                        dotColor="bg-red-500"
                    />
                </div>

                {/* SERVICE TYPE FILTER */}
                <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#737373] px-4 pt-4 pb-2">SERVICE TYPE</div>
                    <FilterCheckbox
                        label="Microservice"
                        isActive={typeFilters.includes('microservice')}
                        onClick={() => onToggleType('microservice')}
                    />
                    <FilterCheckbox
                        label="Database"
                        isActive={typeFilters.includes('database')}
                        onClick={() => onToggleType('database')}
                    />
                    <FilterCheckbox
                        label="Message Queue"
                        isActive={typeFilters.includes('queue')}
                        onClick={() => onToggleType('queue')}
                    />
                    <FilterCheckbox
                        label="Gateway"
                        isActive={typeFilters.includes('gateway')}
                        onClick={() => onToggleType('gateway')}
                    />
                </div>
            </div>

            <div className="mt-auto border-t border-[#2A2A2A] pt-4 mb-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#737373] px-4 pb-2">LEGEND</div>

                <div className="flex items-center gap-2.5 px-4 py-1">
                    <div className="w-4 h-2.5 rounded bg-[#111] border border-green-500/40" />
                    <span className="font-mono text-xs text-[#A1A1A1]">Service (healthy)</span>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-1">
                    <div className="w-4 h-2.5 rounded bg-[#111] border border-amber-500/40" />
                    <span className="font-mono text-xs text-[#A1A1A1]">Service (stale)</span>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-1">
                    <div className="w-4 h-2.5 rounded bg-[#111] border border-red-500/40" />
                    <span className="font-mono text-xs text-[#A1A1A1]">Service (undoc'd)</span>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-1">
                    <div className="w-2.5 h-[14px] rounded bg-[#111] border border-[#2A2A2A]" />
                    <span className="font-mono text-xs text-[#A1A1A1]">Database</span>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-1">
                    <div className="w-2.5 h-2.5 rounded bg-[#111] border border-amber-500/40 origin-center rotate-45" />
                    <span className="font-mono text-xs text-[#A1A1A1]">Message Queue</span>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-1 mt-1">
                    <div className="w-4 border-b border-dashed border-[#F59E0B]" />
                    <span className="font-mono text-xs text-[#A1A1A1]">Async (Event)</span>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-1">
                    <div className="w-4 border-b border-solid border-[#252535]" />
                    <span className="font-mono text-xs text-[#A1A1A1]">Sync (REST/gRPC)</span>
                </div>
            </div>
        </motion.div>
    );
}
