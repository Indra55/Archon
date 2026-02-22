import React from 'react';
import { motion } from 'framer-motion';
import { Network, GitBranch, AlertTriangle, BarChart3 } from 'lucide-react';
import { SERVICES, INFRA, EDGES } from '@/data/knowledgeGraphMockData';
import { ViewMode } from '@/hooks/useKnowledgeGraph';

interface PageHeaderProps {
    viewMode: ViewMode;
    onViewModeChange: (m: ViewMode) => void;
}

export function PageHeader({ viewMode, onViewModeChange }: PageHeaderProps) {
    return (
        <div className="h-[64px] px-8 flex items-center justify-between border-b border-[#2A2A2A] bg-[#0A0A0A] flex-shrink-0">
            <div className="flex items-center gap-4">
                <h1 className="font-['Syne'] text-xl font-bold text-[#E5E5E5]">Knowledge Graph</h1>
                <div className="flex items-center gap-2 ml-4">
                    <div className="flex items-center gap-1.5 bg-[#111] border border-[#2A2A2A] rounded-full px-2.5 py-1 font-mono text-[10px] text-[#A1A1A1]">
                        <Network size={10} />
                        {SERVICES.length + INFRA.length} nodes
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#111] border border-[#2A2A2A] rounded-full px-2.5 py-1 font-mono text-[10px] text-[#A1A1A1]">
                        <GitBranch size={10} />
                        {EDGES.length} connections
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#111] border border-[#2A2A2A] rounded-full px-2.5 py-1 font-mono text-[10px] text-amber-500">
                        <AlertTriangle size={10} />
                        3 health issues
                    </div>
                </div>
            </div>

            <div className="bg-[#111] border border-[#2A2A2A] rounded-xl p-1 flex gap-1">
                <button
                    onClick={() => onViewModeChange('graph')}
                    className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-mono text-xs cursor-pointer transition-colors duration-150 ${viewMode === 'graph' ? 'text-[#E5E5E5]' : 'text-[#A1A1A1] hover:text-[#E5E5E5]'}`}
                >
                    {viewMode === 'graph' && (
                        <motion.div
                            layoutId="modeIndicator"
                            className="absolute inset-0 bg-[#0A0A0A] border border-[#2A2A2A]/50 rounded-lg"
                            style={{ zIndex: 0 }}
                        />
                    )}
                    <Network size={14} className="relative z-10" />
                    <span className="relative z-10 font-medium">Graph View</span>
                </button>

                <button
                    onClick={() => onViewModeChange('health')}
                    className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-mono text-xs cursor-pointer transition-colors duration-150 ${viewMode === 'health' ? 'text-[#E5E5E5]' : 'text-[#A1A1A1] hover:text-[#E5E5E5]'}`}
                >
                    {viewMode === 'health' && (
                        <motion.div
                            layoutId="modeIndicator"
                            className="absolute inset-0 bg-[#0A0A0A] border border-[#2A2A2A]/50 rounded-lg"
                            style={{ zIndex: 0 }}
                        />
                    )}
                    <BarChart3 size={14} className="relative z-10" />
                    <span className="relative z-10 font-medium">Health Dashboard</span>
                </button>
            </div>
        </div>
    );
}
