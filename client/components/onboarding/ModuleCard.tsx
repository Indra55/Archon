import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Shield, CreditCard, ShoppingCart, Bell, BarChart2, GitPullRequest, Lock, CheckCircle } from 'lucide-react';
import { OnboardingModule } from '@/data/onboardingMockData';
import { ModuleStatus } from '@/hooks/useOnboarding';

interface ModuleCardProps {
    module: OnboardingModule;
    status: ModuleStatus;
    isActive: boolean;
    progress: number;
    onSelect: () => void;
}

const iconMap: Record<string, React.ElementType> = {
    'system-overview': LayoutDashboard,
    'auth': Shield,
    'payment': CreditCard,
    'order': ShoppingCart,
    'notification': Bell,
    'analytics': BarChart2,
    'ci-workflow': GitPullRequest,
};

export function ModuleCard({ module, status, isActive, progress, onSelect }: ModuleCardProps) {
    const Icon = iconMap[module.id] || LayoutDashboard;

    let borderColor = 'border-dim';
    let iconColor = 'text-muted';
    let labelColor = 'text-secondary';
    let glowStyle = {};
    let bgClass = 'bg-elevated';

    if (status === 'locked') {
        borderColor = 'border-dim opacity-30';
        iconColor = 'text-muted opacity-50';
        labelColor = 'text-secondary opacity-40';
    } else if (status === 'in_progress') {
        borderColor = 'border-accent';
        iconColor = 'text-accent';
        labelColor = 'text-primary font-semibold';
        glowStyle = { boxShadow: '0 0 20px var(--accent-color, rgba(99,102,241,0.25)), inset 0 0 10px var(--accent-color, rgba(99,102,241,0.1))' };
        bgClass = 'bg-elevated';
    } else if (status === 'completed') {
        borderColor = 'border-green-500/50';
        iconColor = 'text-green-500';
        labelColor = 'text-muted';
        glowStyle = { boxShadow: '0 0 15px rgba(16,185,129,0.1)' };
        bgClass = 'bg-green-500/5';
    }

    const RenderIcon = status === 'locked' ? Lock : (status === 'completed' ? CheckCircle : Icon);

    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div
            className={`flex flex-col items-center gap-3 cursor-pointer relative z-10 w-[80px] group transition-transform ${status === 'locked' ? 'pointer-events-none' : 'hover:-translate-y-1'}`}
            onClick={() => status !== 'locked' && onSelect()}
        >
            <div
                className={`w-[56px] h-[56px] ${bgClass} rounded-2xl flex items-center justify-center border-2 ${borderColor} transition-all duration-300 relative z-10`}
                style={glowStyle}
            >
                <RenderIcon size={22} className={`${iconColor} transition-colors duration-300 group-hover:scale-110`} />

                {status === 'in_progress' && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 56 56">
                        <circle
                            cx="28" cy="28" r="26"
                            fill="transparent"
                            stroke="#6366F1"
                            strokeWidth="2"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-500 ease-in-out opacity-80"
                        />
                    </svg>
                )}
            </div>

            <span className={`font-mono text-[11px] text-center w-full max-w-[80px] leading-tight transition-colors duration-300 ${labelColor} ${status !== 'locked' && !isActive ? 'group-hover:text-muted' : ''}`}>
                {module.title}
            </span>

            {isActive && (
                <motion.div
                    layoutId="activeModuleIndicator"
                    className="absolute -bottom-2 w-[32px] h-[4px] bg-accent rounded-full shadow-sm"
                />
            )}
        </div>
    );
}
