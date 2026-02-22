import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { OnboardingModule } from '@/data/onboardingMockData';
import { ModuleStatus } from '@/hooks/useOnboarding';
import { ModuleCard } from './ModuleCard';

interface LearningTrackProps {
    modules: OnboardingModule[];
    activeModuleId: string;
    getModuleStatus: (id: string) => ModuleStatus;
    currentModuleProgress: number;
    onSelectModule: (id: string) => void;
}

export function LearningTrack({
    modules,
    activeModuleId,
    getModuleStatus,
    currentModuleProgress,
    onSelectModule,
}: LearningTrackProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const activeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeRef.current && scrollRef.current) {
            activeRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, [activeModuleId]);

    return (
        <div className="w-full h-[150px] relative overflow-hidden bg-surface border border-dim rounded-3xl" ref={scrollRef}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent pointer-events-none" />
            <div className="w-full h-full overflow-x-auto overflow-y-hidden scrollbar-hide py-6 px-10">
                <div className="flex relative w-max items-center h-full">
                    {modules.map((module, idx) => {
                        const isLast = idx === modules.length - 1;
                        const status = getModuleStatus(module.id);
                        const isActive = module.id === activeModuleId;
                        const isNextCompletedOrActive = !isLast && getModuleStatus(modules[idx + 1].id) !== 'locked';

                        return (
                            <div
                                key={module.id}
                                ref={isActive ? activeRef : null}
                                className="flex items-center relative group"
                            >
                                <ModuleCard
                                    module={module}
                                    status={status}
                                    isActive={isActive}
                                    progress={currentModuleProgress}
                                    onSelect={() => onSelectModule(module.id)}
                                />

                                {!isLast && (
                                    <div className="w-[100px] h-[3px] bg-elevated z-0 mx-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${status === 'completed' || isNextCompletedOrActive ? 'bg-accent' : 'bg-transparent'
                                                }`}
                                            style={{ width: status === 'completed' || isNextCompletedOrActive ? '100%' : '0%' }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
