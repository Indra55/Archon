import React from 'react';
import { EngineerRole, ROLES } from '@/data/onboardingMockData';
import { OnboardingProgressBar } from './OnboardingProgressBar';
import { Sparkles, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface WelcomeBannerProps {
    activeRole: EngineerRole | null;
    hasSelectedRole: boolean;
    overallProgress: number;
    completedTasksForRole: number;
    totalTasksForRole: number;
    estimatedDaysRemaining: number;
    onChangeRole: () => void;
}

export function WelcomeBanner({
    activeRole,
    hasSelectedRole,
    overallProgress,
    completedTasksForRole,
    totalTasksForRole,
    estimatedDaysRemaining,
    onChangeRole,
}: WelcomeBannerProps) {
    if (!hasSelectedRole) {
        return (
            <div className="relative overflow-hidden bg-gradient-to-b from-[#11111A] to-[#0A0A0A] border-b border-[#2A2A2A] px-8 py-20 text-center">
                {/* Background ambient light */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#6366F1]/10 blur-[120px] rounded-full pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative z-10"
                >
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="font-['Syne'] font-bold text-sm text-[#737373] tracking-widest">KA-CHOW</span>
                        <span className="font-mono text-[10px] tracking-widest text-[#E5E5E5] bg-[#6366F1]/20 border border-[#6366F1]/40 rounded-full px-3 py-1 text-[#6366F1]">ONBOARDING</span>
                    </div>

                    <h1 className="font-['Syne'] text-6xl font-extrabold text-[#E5E5E5] tracking-tight leading-tight">
                        Welcome to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]">system.</span>
                    </h1>

                    <p className="font-mono text-base text-[#A1A1A1] mt-6 max-w-2xl mx-auto leading-relaxed">
                        Let's build you a personalized learning path based on how you'll be working with the codebase. This takes about 10–14 days at a comfortable pace.
                    </p>

                    <div className="flex justify-center gap-10 mt-12">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
                                <Target size={18} className="text-[#6366F1]" />
                            </div>
                            <span className="font-mono text-xs text-[#737373]">Real artifacts</span>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
                                <Zap size={18} className="text-amber-500" />
                            </div>
                            <span className="font-mono text-xs text-[#737373]">Live progress</span>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
                                <Sparkles size={18} className="text-green-500" />
                            </div>
                            <span className="font-mono text-xs text-[#737373]">AI-assisted</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    const roleDef = ROLES.find(r => r.id === activeRole);

    return (
        <div className="bg-[#11111A] border-b border-[#2A2A2A] px-10 py-8 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#6366F1]/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex-1 relative z-10">
                <div className="bg-[#1A1A1A]/80 backdrop-blur-md border border-[#2A2A2A] rounded-full px-4 py-1.5 flex items-center gap-3 w-fit shadow-lg">
                    <span className="text-base">{roleDef?.icon}</span>
                    <span className="font-mono text-sm text-[#E5E5E5] font-medium">{roleDef?.label}</span>
                    <span className="text-[#444] font-mono text-sm">|</span>
                    <button onClick={onChangeRole} className="font-mono text-xs text-[#6366F1] cursor-pointer hover:text-[#8B5CF6] transition-colors outline-none font-medium">Change Role</button>
                </div>
                <h2 className="font-['Syne'] text-3xl font-bold text-[#E5E5E5] mt-5 tracking-tight">Your learning path is ready.</h2>
                <p className="font-mono text-sm text-[#A1A1A1] mt-2 flex items-center gap-2">
                    <span className="text-[#E5E5E5] font-medium">{totalTasksForRole} tasks</span> across <span className="text-[#E5E5E5] font-medium">{roleDef?.moduleIds.length} services</span>
                    <span className="text-[#444] text-xs">•</span>
                    <span>~{estimatedDaysRemaining} days remaining</span>
                </p>
            </div>
            <div className="w-80 text-right relative z-10 bg-[#0A0A0A]/50 backdrop-blur border border-[#2A2A2A] rounded-2xl p-5 shadow-xl">
                <div className="mb-3 flex items-end justify-end gap-2">
                    <span className="font-['Syne'] text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]">{overallProgress}%</span>
                    <span className="font-mono text-sm text-[#737373] mb-1.5 uppercase tracking-widest">Complete</span>
                </div>
                <OnboardingProgressBar value={overallProgress} height={8} />
                <div className="font-mono text-[11px] text-[#A1A1A1] mt-3 uppercase tracking-wider font-medium">
                    {completedTasksForRole} of {totalTasksForRole} tasks done
                </div>
            </div>
        </div>
    );
}
