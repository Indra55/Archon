'use client'

import React from 'react'
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import { COMMIT_HISTORY } from '@/lib/mockData'

/* eslint-disable @typescript-eslint/no-explicit-any */
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-elevated border border-dim rounded-lg px-3 py-2 shadow-lg">
                <p className="font-mono text-[11px] text-primary mb-1">{label}</p>
                <div className="flex flex-col gap-1 font-mono text-[11px]">
                    <span className="text-accent">{payload[0].value} commits</span>
                    {payload[1] && <span className="text-green">{payload[1].value} pushes</span>}
                </div>
            </div>
        )
    }
    return null
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function CommitSparkline() {
    return (
        <div className="bg-surface border border-dim rounded-xl p-5 w-full">
            <div className="flex items-center mb-4">
                <h3 className="font-sans text-sm font-semibold text-primary">Commit Activity</h3>
                <span className="ml-auto font-mono text-[11px] text-muted">Last 30 days</span>
            </div>

            <div className="h-[160px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={COMMIT_HISTORY} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="#262633" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val, i) => (i % 5 === 0 ? val : '')}
                            tick={{ fontSize: 10, fill: '#71717A', fontFamily: 'monospace' }}
                            dy={10}
                        />
                        <YAxis hide domain={['dataMin', 'dataMax + 5']} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#262633', opacity: 0.2 }} />
                        <Bar dataKey="commits" fill="#6366F1" fillOpacity={0.6} radius={[2, 2, 0, 0]} />
                        <Line
                            type="monotone"
                            dataKey="pushes"
                            stroke="#10B981"
                            strokeWidth={1.5}
                            dot={false}
                            activeDot={{ r: 4, fill: '#10B981', stroke: '#10B981' }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-4 mt-3 pl-2">
                <div className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                    <div className="w-2.5 h-2.5 bg-accent rounded-[2px]" />
                    <span className="font-mono text-[11px] text-secondary">Commits</span>
                </div>
                <div className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                    <div className="w-2.5 h-2.5 bg-green rounded-[2px]" />
                    <span className="font-mono text-[11px] text-secondary">Pushes</span>
                </div>
            </div>
        </div>
    )
}
