import React from 'react'

export function SystemHealthRing({ score }: { score: number }) {
    const radius = 41
    const circumference = 2 * Math.PI * radius

    let strokeColor = '#10B981' // green
    if (score < 50) strokeColor = '#EF4444' // red
    else if (score <= 75) strokeColor = '#F59E0B' // amber

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-[88px] h-[88px] flex justify-center items-center">
                <svg width="88" height="88" viewBox="0 0 88 88" className="rotate-[-90deg]">
                    {/* Background Ring */}
                    <circle
                        cx="44" cy="44" r={radius}
                        fill="none"
                        stroke="var(--color-border-dim, #262633)"
                        strokeWidth="6"
                    />
                    {/* Progress Ring */}
                    <circle
                        cx="44" cy="44" r={radius}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="6"
                        strokeLinecap="round"
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: circumference,
                            transition: "stroke-dashoffset 800ms cubic-bezier(0.16, 1, 0.3, 1)"
                        }}
                        ref={el => {
                            if (el) {
                                setTimeout(() => {
                                    el.style.strokeDashoffset = `${circumference * (1 - score / 100)}`
                                }, 50)
                            }
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                    <div className="flex items-baseline gap-0.5">
                        <span className="font-sans text-[1.5rem] font-bold text-primary">{score}</span>
                        <span className="font-mono text-[10px] text-muted">/100</span>
                    </div>
                </div>
            </div>
            <div className="font-mono text-[11px] text-muted text-center mt-2">
                System Health
            </div>
        </div>
    )
}
