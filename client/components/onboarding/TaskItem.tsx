import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Map, Code2, HelpCircle, Lock, CheckCheck, ExternalLink } from 'lucide-react';
import { OnboardingTask } from '@/data/onboardingMockData';
import { TaskStatus } from '@/hooks/useOnboarding';

interface TaskItemProps {
    task: OnboardingTask;
    status: TaskStatus;
    onOpen: () => void;
    onComplete: () => void;
}

export function TaskItem({ task, status, onOpen, onComplete }: TaskItemProps) {
    const [justCompleted, setJustCompleted] = useState(false);

    React.useEffect(() => {
        if (status === 'completed' && !justCompleted) {
            setJustCompleted(true);
            setTimeout(() => setJustCompleted(false), 400);
        }
    }, [status]);

    let iconBg = 'bg-elevated';
    let iconBorder = 'border-dim';
    let iconColor = 'text-muted';
    let Icon = BookOpen;

    if (status === 'locked') {
        iconColor = 'text-muted opacity-50';
        Icon = Lock;
    } else if (status === 'completed') {
        iconBg = 'bg-green-500/10';
        iconBorder = 'border-green-500/20';
        iconColor = 'text-green-500';
        Icon = CheckCheck;
    } else {
        // available or in_progress
        if (status === 'in_progress') {
            iconBg = 'bg-[#6366F1]/15';
            iconBorder = 'border-[#6366F1]/30';
            iconColor = 'text-[#6366F1]';
        } else {
            iconColor = 'text-muted';
        }

        if (task.type === 'explore') Icon = Map;
        if (task.type === 'task') Icon = Code2;
        if (task.type === 'quiz') Icon = HelpCircle;
    }

    const badgeProps = {
        read: { bg: 'bg-[#6366F1]/10', text: 'text-[#6366F1]', border: 'border-[#6366F1]/20' },
        explore: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' },
        task: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
        quiz: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
    }[task.type] || { bg: 'bg-elevated', text: 'text-muted', border: 'border-dim' };

    const handleComplete = () => {
        onComplete();
    };

    return (
        <div className={`flex items-start gap-5 relative py-3 group ${status === 'locked' ? 'opacity-40 grayscale' : ''}`}>
            {justCompleted && (
                <motion.div
                    className="absolute inset-0 bg-green-500/10 z-0 pointer-events-none rounded-xl"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.4 }}
                />
            )}

            {/* Background highlight on hover for available tasks */}
            {status !== 'locked' && (
                <div className="absolute inset-0 -mx-4 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            )}

            <div className={`w-[44px] h-[44px] rounded-2xl flex items-center justify-center border shadow-sm ${iconBg} ${iconBorder} relative z-10 shrink-0 transition-colors`}>
                <Icon size={20} className={iconColor} />
            </div>

            <div className="flex-1 min-w-0 pt-1 z-10 w-full">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className={`font-mono text-base font-semibold truncate ${status === 'locked' ? 'text-muted opacity-60' : 'text-primary group-hover:text-accent transition-colors'}`}>
                        {task.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono text-[11px] font-medium text-muted bg-elevated border border-dim rounded-full px-2.5 py-0.5 shadow-sm">
                            {task.estimatedMinutes} min
                        </span>
                        <span className={`font-mono text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-0.5 ${badgeProps.bg} ${badgeProps.text} border ${badgeProps.border} shadow-sm`}>
                            {task.type}
                        </span>
                    </div>
                </div>

                {status !== 'locked' && (
                    <p className="font-mono text-sm text-secondary mt-2 mb-1 leading-relaxed max-w-2xl">
                        {task.description}
                    </p>
                )}

                {status !== 'locked' && (
                    <div className="mt-4 flex items-center gap-3">
                        {status !== 'completed' ? (
                            <>
                                <button
                                    onClick={onOpen}
                                    className="bg-elevated hover:bg-accent border border-dim hover:border-accent text-primary hover:text-white rounded-xl px-5 py-2 font-mono text-sm font-medium flex items-center gap-2 transition-all shadow-sm cursor-pointer outline-none"
                                >
                                    {task.type === 'quiz' ? 'Begin Quiz' : 'Start Task'}
                                    <ExternalLink size={14} />
                                </button>
                                <button
                                    onClick={handleComplete}
                                    className="bg-transparent hover:bg-elevated border border-transparent hover:border-dim rounded-xl px-4 py-2 font-mono text-sm text-muted hover:text-primary flex items-center gap-2 transition-all cursor-pointer outline-none"
                                >
                                    <CheckCheck size={14} />
                                    Mark done
                                </button>
                            </>
                        ) : (
                            <span className="font-mono text-sm font-medium text-green-500 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 w-fit">
                                <CheckCheck size={16} className="text-green-500" />
                                Completed
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
