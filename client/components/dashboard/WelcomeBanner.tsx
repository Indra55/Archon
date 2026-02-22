'use client'

import React from 'react'
import { SystemHealthRing } from './SystemHealthRing'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export function WelcomeBanner() {
    const router = useRouter()
    const { user } = useAuth()


    const chips = [
        { label: "System Health: 74/100", dot: "bg-green", route: "/dashboard/self-healer" },
        { label: "11 Open Violations", dot: "bg-amber", route: "/dashboard/ci-enforcer" },
        { label: "1 PR Blocked", dot: "bg-red", route: "/dashboard/ci-enforcer" },
        { label: "Last push: 14 min ago", dot: "bg-accent", route: "/dashboard/timeline" },
    ]

    return (
        <div className="w-full bg-surface border border-dim rounded-2xl p-6 flex items-center justify-between">
            {/* Left */}
            <div>
                <h2 className="font-sans text-[1.6rem] font-bold text-primary tracking-tight">
                    Good morning, {user?.username || 'Engineer'}.
                </h2>
                <p className="font-mono text-sm text-secondary mt-1">
                    {user?.kachow_role || 'Backend Engineer'} · my-org/backend

                </p>

                <div className="flex flex-wrap items-center gap-2 mt-4 cursor-pointer">
                    {chips.map((chip, i) => (
                        <div
                            key={i}
                            onClick={() => router.push(chip.route)}
                            className="bg-elevated border border-dim rounded-full px-3 py-1.5 flex items-center gap-2 font-mono text-[11px] text-secondary hover:border-focus transition-colors"
                        >
                            <div className={`w-[6px] h-[6px] rounded-full ${chip.dot}`} />
                            {chip.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right */}
            <div className="shrink-0 pl-6 border-l border-dim/50 hidden sm:block">
                <SystemHealthRing score={74} />
            </div>
        </div>
    )
}
