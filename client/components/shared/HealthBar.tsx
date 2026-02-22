import React, { useEffect, useState } from 'react';

interface HealthBarProps {
    value: number; // 0-100
    height?: number; // default 6px
    showLabel?: boolean; // default false
    animateOnMount?: boolean; // default true
}

export function HealthBar({ value, height = 6, showLabel = false, animateOnMount = true }: HealthBarProps) {
    const [currentValue, setCurrentValue] = useState(animateOnMount ? 0 : value);

    useEffect(() => {
        if (animateOnMount) {
            const timer = setTimeout(() => {
                setCurrentValue(value);
            }, 50);
            return () => clearTimeout(timer);
        } else {
            setCurrentValue(value);
        }
    }, [value, animateOnMount]);

    let fillColor = 'bg-red-500';
    if (currentValue > 40 && currentValue <= 70) fillColor = 'bg-amber-500';
    if (currentValue > 70) fillColor = 'bg-green-500';

    return (
        <div className="flex items-center gap-2 flex-1 w-full relative">
            <div
                className="bg-[#1A1A1A] rounded-full w-full overflow-hidden"
                style={{ height: `${height}px` }}
            >
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${fillColor}`}
                    style={{ width: `${currentValue}%` }}
                />
            </div>
            {showLabel && (
                <span className="font-mono text-xs text-[#737373] ml-2 w-[32px]">{value}%</span>
            )}
        </div>
    );
}
