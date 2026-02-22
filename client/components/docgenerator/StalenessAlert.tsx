import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface StalenessAlertProps {
    daysSinceUpdate: number | null
}

export function StalenessAlert({ daysSinceUpdate }: StalenessAlertProps) {
    if (daysSinceUpdate === null) return null

    return (
        <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full px-2.5 py-1 flex items-center gap-1.5 font-mono text-[10px] sm:text-xs">
            <AlertTriangle size={11} strokeWidth={2.5} />
            <span>Updated {daysSinceUpdate} days ago</span>
        </div>
    )
}
