import React from 'react';
import { motion } from 'framer-motion';
import { ActiveTab } from '@/hooks/useCIEnforcer';

interface TabBarProps {
    activeTab: ActiveTab;
    onTabChange: (tab: ActiveTab) => void;
    flaggedCount: number;
}

export function TabBar({ activeTab, onTabChange, flaggedCount }: TabBarProps) {
    return (
        <div className="px-8 pt-4 pb-0 bg-[#0A0A0A] border-b border-[#2A2A2A] flex gap-0 relative">
            <div
                onClick={() => onTabChange('feed')}
                className={`relative px-4 pb-3 font-mono text-sm font-medium cursor-pointer transition-colors duration-120 flex items-center ${activeTab === 'feed' ? 'text-[#E5E5E5]' : 'text-[#A1A1A1] hover:text-[#E5E5E5]'}`}
            >
                <span>PR Feed</span>
                {flaggedCount > 0 && (
                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-full px-2 py-0.5 font-mono text-[10px] ml-2">
                        {flaggedCount}
                    </span>
                )}
                {activeTab === 'feed' && (
                    <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#6366F1] z-10"
                    />
                )}
            </div>

            <div
                onClick={() => onTabChange('policies')}
                className={`relative px-4 pb-3 font-mono text-sm font-medium cursor-pointer transition-colors duration-120 flex items-center ${activeTab === 'policies' ? 'text-[#E5E5E5]' : 'text-[#A1A1A1] hover:text-[#E5E5E5]'}`}
            >
                <span>Policy Manager</span>
                {activeTab === 'policies' && (
                    <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#6366F1] z-10"
                    />
                )}
            </div>
        </div>
    );
}
