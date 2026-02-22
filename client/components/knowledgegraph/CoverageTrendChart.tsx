import React from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { COVERAGE_TREND } from '@/data/knowledgeGraphMockData';

// Custom dark tooltip component matching generic product styles
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#111]/90 backdrop-blur-sm border border-[#2A2A2A] rounded-lg p-3 shadow-xl pointer-events-none">
                <p className="font-mono text-[10px] text-[#A1A1A1] uppercase tracking-widest mb-2">{label}</p>
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-sm bg-[#6366F1]" />
                        <span className="font-mono text-xs text-[#E5E5E5]">{payload[0].value}% Doc Coverage</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-sm bg-green-500" />
                        <span className="font-mono text-xs text-[#E5E5E5]">{payload[1].value}% API Coverage</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export function CoverageTrendChart() {
    return (
        <>
            <div className="mb-4">
                <h2 className="font-['Syne'] text-sm font-semibold text-[#E5E5E5]">Coverage Trend</h2>
                <p className="font-mono text-xs text-[#737373] mt-0.5">Last 30 days</p>
            </div>

            <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={COVERAGE_TREND} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="rgba(37,37,53,0.6)" strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            interval={8}
                            tick={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fill: '#737373' }}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            domain={[50, 100]}
                            tick={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fill: '#737373' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={value => `${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2A2A2A', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        <Line type="monotone" dataKey="docCoverage" stroke="#6366F1" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="apiCoverage" stroke="#22C55E" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-3 flex gap-4 pl-8">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-[#6366F1]" />
                    <span className="font-mono text-xs text-[#A1A1A1]">Doc Coverage</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-green-500" />
                    <span className="font-mono text-xs text-[#A1A1A1]">API Coverage</span>
                </div>
            </div>
        </>
    );
}
