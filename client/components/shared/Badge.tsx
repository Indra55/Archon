import React from 'react'

interface BadgeProps {
    label: string;
    variant: "green" | "amber" | "red" | "accent" | "muted";
    size?: "sm" | "xs";
}

export function Badge({ label, variant, size = "sm" }: BadgeProps) {
    const colorMap = {
        green: "bg-green/10 text-green border-green/20",
        amber: "bg-amber/10 text-amber border-amber/20",
        red: "bg-red/10 text-red border-red/20",
        accent: "bg-accent/10 text-accent border-accent/20",
        muted: "bg-elevated text-muted border-dim",
    }

    const sizeMap = {
        sm: "px-2.5 py-1 text-[10px]",
        xs: "px-2 py-0.5 text-[10px]",
    }

    return (
        <div className={`border rounded-full flex items-center gap-1.5 font-mono ${colorMap[variant]} ${sizeMap[size]}`}>
            {label}
        </div>
    )
}
