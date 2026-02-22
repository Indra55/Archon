import React from 'react'

interface HealthDotProps {
    status: "healthy" | "stale" | "critical" | "pending";
    size?: number;
}

export function HealthDot({ status, size = 8 }: HealthDotProps) {
    let colorClass = ""
    let pulse = false

    switch (status) {
        case "healthy":
            colorClass = "bg-green"
            break
        case "stale":
            colorClass = "bg-amber"
            break
        case "critical":
            colorClass = "bg-red"
            break
        case "pending":
            colorClass = "bg-amber"
            pulse = true
            break
    }

    return (
        <div
            className={`rounded-full ${colorClass} ${pulse ? "animate-pulse" : ""}`}
            style={{ width: size, height: size }}
        />
    )
}
