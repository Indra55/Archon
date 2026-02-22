"use client";

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { EngineerRole, KEY_ADRS } from '@/data/onboardingMockData';
import { useOnboarding } from '@/hooks/useOnboarding';
import { LearningTrack } from './LearningTrack';
import { ActiveModulePanel } from './ActiveModulePanel';
import { QuickReferencePanel } from './QuickReferencePanel';
import { TaskDetailModal } from './TaskDetailModal';
import { CompletionCelebration } from './CompletionCelebration';
import { BookOpen } from 'lucide-react';

export function OnboardingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const ob = useOnboarding();

    useEffect(() => {
        const roleParam = searchParams.get('role');
        const moduleParam = searchParams.get('module');
        const taskParam = searchParams.get('task');

        if (roleParam) {
            if (['backend', 'frontend', 'sre', 'data'].includes(roleParam)) {
                ob.setActiveRole(roleParam as EngineerRole);
            } else {
                ob.setActiveRole('backend');
            }
        }

        if (moduleParam) {
            ob.setActiveModuleId(moduleParam);
        }

        if (taskParam) {
            let foundTask = false;
            for (const m of ob.modulesForRole) {
                if (m.tasks.some(t => t.id === taskParam)) {
                    ob.setActiveModuleId(m.id);
                    foundTask = true;
                    break;
                }
            }
            ob.openTask(taskParam);
        }
    }, [searchParams]);

    const relevantADRs = ob.activeRole ? KEY_ADRS.filter(a => a.relevantRoles.includes(ob.activeRole!)) : [];

    return (
        <div className="bg-base min-h-[calc(100vh-56px)] flex flex-col font-['Inter',sans-serif]">
            <div className="flex-1 w-full bg-base relative pt-10">
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-surface to-transparent pointer-events-none" />
                <motion.div
                    key="main-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full flex flex-col max-w-7xl mx-auto relative z-10 text-primary"
                >
                    <div className="px-8 mb-6">
                        <h1 className="font-['Syne'] text-4xl font-bold tracking-tight mb-2 text-primary">Onboarding Track</h1>
                        <p className="font-mono text-sm text-muted">Complete the modules below to get fully up to speed.</p>
                    </div>

                    <div className="mb-4 px-8">
                        <LearningTrack
                            modules={ob.modulesForRole}
                            activeModuleId={ob.activeModuleId}
                            getModuleStatus={ob.getModuleStatus}
                            currentModuleProgress={ob.currentModuleProgress}
                            onSelectModule={ob.setActiveModuleId}
                        />
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 px-8 py-6 pb-20 items-start w-full">
                        <div className="flex-1 min-w-0 w-full relative flex flex-col gap-8">
                            <AnimatePresence mode="wait">
                                {ob.activeModuleId && (
                                    <ActiveModulePanel
                                        key={ob.activeModuleId}
                                        module={ob.modulesForRole.find(m => m.id === ob.activeModuleId)!}
                                        getTaskStatus={ob.getTaskStatus}
                                        onOpenTask={ob.openTask}
                                        onCompleteTask={ob.completeTask}
                                        currentModuleProgress={ob.currentModuleProgress}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Key Decisions under Active Modules Table */}
                            <div className="bg-surface border border-dim rounded-3xl overflow-hidden shadow-xl mt-4">
                                <div className="px-8 py-6 border-b border-dim flex items-center gap-3 bg-elevated">
                                    <div className="bg-base p-2 rounded-xl text-amber-500 border border-dim">
                                        <BookOpen size={20} />
                                    </div>
                                    <h2 className="font-['Syne'] text-2xl font-bold text-primary tracking-tight">Key Decisions</h2>
                                </div>
                                <div className="flex flex-col p-4 gap-2 bg-surface">
                                    {relevantADRs.map(adr => (
                                        <div key={adr.id} className="px-6 py-5 hover:bg-elevated rounded-2xl transition-colors flex items-center gap-4 group">
                                            <span className="bg-base border border-dim rounded-md px-2.5 py-1.5 font-mono text-xs text-accent font-bold shrink-0 shadow-sm">
                                                {adr.id}
                                            </span>
                                            <span className="font-mono text-base text-primary group-hover:text-accent transition-colors flex-1" title={adr.title}>
                                                {adr.title}
                                            </span>
                                            <button
                                                onClick={() => router.push(adr.deepLink)}
                                                className="bg-elevated hover:bg-accent text-primary hover:text-white border border-dim p-2.5 rounded-xl transition-colors outline-none shrink-0"
                                                aria-label="Read decision"
                                            >
                                                <BookOpen size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {relevantADRs.length === 0 && (
                                        <div className="px-6 py-8 text-center text-[#888] font-mono text-sm">
                                            No key decisions found for your role.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-80 flex-shrink-0 sticky top-6">
                            <QuickReferencePanel
                                activeRole={ob.activeRole}
                                onNavigate={(path) => router.push(path)}
                            />
                        </div>
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {ob.activeTaskId !== null && (
                    <TaskDetailModal
                        task={ob.modulesForRole
                            .flatMap(m => m.tasks)
                            .find(t => t.id === ob.activeTaskId)!}
                        onClose={ob.closeTask}
                        onComplete={(id) => { ob.completeTask(id); ob.closeTask(); }}
                        onNavigate={(path) => router.push(path)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {ob.showCelebration && (
                    <CompletionCelebration onDismiss={ob.dismissCelebration} />
                )}
            </AnimatePresence>
        </div>
    );
}
