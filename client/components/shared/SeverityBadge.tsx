import React from 'react';

interface SeverityBadgeProps {
    level: 'critical' | 'high' | 'medium' | 'low';
    size?: 'sm' | 'xs';
}

export function SeverityBadge({ level, size = 'sm' }: SeverityBadgeProps) {
    let badgeClasses = 'rounded-full font-mono font-bold uppercase flex items-center justify-center whitespace-nowrap ';

    if (size === 'sm') {
        badgeClasses += 'px-2.5 py-0.5 text-xs';
    } else {
        badgeClasses += 'px-2 py-0.5 text-[10px]';
    }

    switch (level) {
        case 'critical':
            badgeClasses += ' bg-red-500/10 text-red-500 border border-red-500/20';
            break;
        case 'high':
            badgeClasses += ' bg-amber-500/10 text-amber-500 border border-amber-500/20';
            break;
        case 'medium':
            badgeClasses += ' bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
            break;
        case 'low':
            badgeClasses += ' bg-green-500/10 text-green-500 border border-green-500/20';
            break;
    }

    return (
        <div className={badgeClasses}>
            {level.toUpperCase()}
        </div>
    );
}
