import React, { useEffect, useState } from 'react';
import { ComposedChart, Line } from 'recharts';
import { SPARKLINE_DATA } from '@/data/ciEnforcerMockData';

// Custom hook for count up animation
function useCountUp(target: number, duration: number = 800) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // ease-out curve
            const easeOut = 1 - Math.pow(1 - percentage, 3);
            setCount(Math.floor(easeOut * target));

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

interface StatsBarProps {
    stats: {
        totalThisWeek: number;
        passing: number;
        passingPercent: number;
        flagged: number;
        flaggedPercent: number;
        critical: number;
    };
}

export function StatsBar({ stats }: StatsBarProps) {
    const total = useCountUp(stats.totalThisWeek);
    const passing = useCountUp(stats.passing);
    const flagged = useCountUp(stats.flagged);
    const critical = useCountUp(stats.critical);

    return (
        <div className="px-8 py-5 border-b border-[#2A2A2A] bg-[#111] flex flex-row items-center w-full">
            <div className="flex gap-8">
                {/* Stat 1 */}
                <div className="flex flex-col gap-0.5">
                    <div className="font-['Syne'] text-2xl font-bold text-[#E5E5E5]">{total}</div>
                    <div className="font-mono text-xs uppercase tracking-widest text-[#737373] mt-0.5">PRs THIS WEEK</div>
                    <div className="font-mono text-xs text-[#A1A1A1] mt-0.5">total pull requests</div>
                </div>

                <div className="w-[1px] h-8 bg-[#2A2A2A] self-center mx-2" />

                {/* Stat 2 */}
                <div className="flex flex-col gap-0.5">
                    <div className="font-['Syne'] text-2xl font-bold text-green-500">{passing}</div>
                    <div className="font-mono text-xs uppercase tracking-widest text-[#737373] mt-0.5">PASSING</div>
                    <div className="font-mono text-xs text-green-500 mt-0.5">{stats.passingPercent}% pass rate</div>
                </div>

                <div className="w-[1px] h-8 bg-[#2A2A2A] self-center mx-2" />

                {/* Stat 3 */}
                <div className="flex flex-col gap-0.5">
                    <div className="font-['Syne'] text-2xl font-bold text-red-500">{flagged}</div>
                    <div className="font-mono text-xs uppercase tracking-widest text-[#737373] mt-0.5">FLAGGED</div>
                    <div className="font-mono text-xs text-red-500 mt-0.5">{stats.flaggedPercent}% need attention</div>
                </div>

                <div className="w-[1px] h-8 bg-[#2A2A2A] self-center mx-2" />

                {/* Stat 4 */}
                <div className="flex flex-col gap-0.5">
                    <div className="font-['Syne'] text-2xl font-bold text-red-500">{critical}</div>
                    <div className="font-mono text-xs uppercase tracking-widest text-[#737373] mt-0.5">CRITICAL</div>
                    <div className="font-mono text-xs text-red-500 mt-0.5">violations this week</div>
                </div>
            </div>

            <div className="ml-auto flex flex-col items-end">
                <ComposedChart width={240} height={56} data={SPARKLINE_DATA}>
                    <Line type="monotone" dataKey="passing" stroke="#22C55E" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="flagged" stroke="#EF4444" strokeWidth={1.5} dot={false} strokeDasharray="3 3" isAnimationActive={false} />
                </ComposedChart>

                <div className="mt-1 flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <svg width="28" height="8">
                            <line x1="0" y1="4" x2="28" y2="4" stroke="#22C55E" strokeWidth="1.5" />
                        </svg>
                        <span className="font-mono text-xs text-[#A1A1A1]">Passing</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <svg width="28" height="8">
                            <line x1="0" y1="4" x2="28" y2="4" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
                        </svg>
                        <span className="font-mono text-xs text-[#A1A1A1]">Flagged</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
