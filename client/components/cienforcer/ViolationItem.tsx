import React from 'react';
import { AlertCircle, AlertTriangle, Info, ArrowUpRight } from 'lucide-react';
import { Violation } from '@/data/ciEnforcerMockData';
import { SeverityBadge } from '../shared/SeverityBadge';

interface ViolationItemProps {
    violation: Violation;
    onAction: (route: string) => void;
}

export function ViolationItem({ violation, onAction }: ViolationItemProps) {
    let iconObj;
    let iconBgClass = '';

    switch (violation.severity) {
        case 'critical':
            iconObj = <AlertCircle size={14} className="text-red-500" />;
            iconBgClass = 'bg-red-500/10';
            break;
        case 'high':
            iconObj = <AlertTriangle size={14} className="text-amber-500" />;
            iconBgClass = 'bg-amber-500/10';
            break;
        case 'medium':
            iconObj = <Info size={14} className="text-yellow-400" />;
            iconBgClass = 'bg-yellow-500/10';
            break;
        case 'low':
            iconObj = <Info size={14} className="text-green-500" />;
            iconBgClass = 'bg-green-500/10';
            break;
    }

    return (
        <div className="px-5 py-4 border-b border-[#2A2A2A] last:border-0 flex items-start gap-3">
            <div className={`flex-shrink-0 w-[28px] h-[28px] rounded-full flex items-center justify-center ${iconBgClass}`}>
                {iconObj}
            </div>

            <div className="flex-1">
                <div className="font-mono text-sm text-[#E5E5E5] font-medium">{violation.type}</div>
                <div className="font-mono text-xs text-[#A1A1A1] mt-1.5 leading-relaxed">{violation.detail}</div>

                {violation.actionType !== 'none' && (
                    <button
                        onClick={() => {
                            if (violation.actionType === 'external') {
                                window.open('#', '_blank');
                            } else if (violation.actionRoute) {
                                onAction(violation.actionRoute);
                            }
                        }}
                        className="mt-3 border border-[#2A2A2A] bg-transparent rounded-lg px-3 py-1.5 flex items-center gap-1.5 w-fit font-mono text-xs text-[#A1A1A1] hover:border-[#6366F1] hover:text-[#E5E5E5] transition-colors duration-120"
                    >
                        {violation.actionLabel}
                        <ArrowUpRight size={12} />
                    </button>
                )}
            </div>

            <div className="flex-shrink-0">
                <SeverityBadge level={violation.severity} size="xs" />
            </div>
        </div>
    );
}
