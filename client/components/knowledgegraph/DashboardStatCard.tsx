import React from 'react';
import { LucideIcon, Network, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom hook for count up animation (reused or duplicated for simplicity)
function useCountUp(target: number, duration: number = 800) {
    const [count, setCount] = React.useState(0);

    React.useEffect(() => {
        let startTime: number | null = null;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            const MathPow = Math.pow(1 - percentage, 3);
            setCount(Math.floor((1 - MathPow) * target));

            if (progress < duration) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(target);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [target, duration]);

    return count;
}

interface DashboardStatCardProps {
    label: string;
    value: string | number;
    unit?: string;
    delta?: string;
    deltaPositive?: boolean;
    icon: LucideIcon;
}

export function DashboardStatCard({
    label,
    value,
    unit,
    delta,
    deltaPositive,
    icon: Icon
}: DashboardStatCardProps) {
    const numericValue = typeof value === 'number' ? useCountUp(value) : value;

    return (
        <div className="bg-[#111] border border-[#2A2A2A] rounded-2xl p-5 hover:border-[#6366F1] cursor-default transition duration-150">
            <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
                    {label}
                </div>
                <Icon size={18} className="text-[#A1A1A1]" />
            </div>

            <div className="mt-2">
                <span className="font-['Syne'] text-3xl font-bold text-[#E5E5E5]">
                    {numericValue}
                </span>
                {unit && (
                    <span className="font-mono text-sm text-[#737373] ml-1">{unit}</span>
                )}
            </div>

            {delta && (
                <div className={`font-mono text-xs mt-2 ${deltaPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {deltaPositive ? '↑' : '↓'} {delta}
                </div>
            )}
        </div>
    );
}
