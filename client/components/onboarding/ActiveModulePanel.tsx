import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingModule } from '@/data/onboardingMockData';
import { TaskStatus } from '@/hooks/useOnboarding';
import { TaskItem } from './TaskItem';
import { OnboardingProgressBar } from './OnboardingProgressBar';

interface ActiveModulePanelProps {
    module: OnboardingModule;
    getTaskStatus: (id: string) => TaskStatus;
    onOpenTask: (taskId: string) => void;
    onCompleteTask: (taskId: string) => void;
    currentModuleProgress: number;
}

export function ActiveModulePanel({
    module,
    getTaskStatus,
    onOpenTask,
    onCompleteTask,
    currentModuleProgress,
}: ActiveModulePanelProps) {
    const completedCount = module.tasks.filter(t => getTaskStatus(t.id) === 'completed').length;

    return (
        <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-surface border border-dim rounded-3xl overflow-hidden shadow-2xl relative"
        >
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-surface/50 to-transparent pointer-events-none" />

            <div className="px-8 py-7 border-b border-dim relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="font-['Syne'] text-3xl font-bold text-primary tracking-tight">
                        {module.title}
                    </h2>
                    <div className="bg-elevated/80 backdrop-blur border border-dim rounded-full px-4 py-1.5 font-mono text-[11px] font-medium text-muted shadow-sm">
                        <span className="text-primary">{completedCount}</span> / {module.tasks.length} tasks
                    </div>
                </div>
                <p className="font-mono text-sm text-muted mt-2 mb-6 leading-relaxed max-w-2xl">
                    {module.description}
                </p>
                <div>
                    <OnboardingProgressBar value={currentModuleProgress} variant="thin" height={4} />
                </div>
            </div>

            <div className="px-8 py-6 flex flex-col gap-6 relative z-10 bg-base">
                {module.tasks.map((task, index) => {
                    const status = getTaskStatus(task.id);
                    return (
                        <div key={task.id} className="relative">
                            {index > 0 && (
                                <div className="absolute top-[-24px] bottom-0 left-[22px] w-[2px] bg-gradient-to-b from-dim to-elevated -z-10" />
                            )}
                            <TaskItem
                                task={task}
                                status={status}
                                onOpen={() => onOpenTask(task.id)}
                                onComplete={() => onCompleteTask(task.id)}
                            />
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
