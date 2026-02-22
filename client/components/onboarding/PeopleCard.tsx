import React, { useState } from 'react';
import { PersonToKnow } from '@/data/onboardingMockData';
import { Hash, Copy, Check } from 'lucide-react';

interface PeopleCardProps {
    person: PersonToKnow;
}

export function PeopleCard({ person }: PeopleCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(person.slackHandle);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="px-5 py-4 hover:bg-elevated rounded-xl transition-all duration-300 flex items-center gap-4 group cursor-pointer">
            <div className="w-[48px] h-[48px] bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 rounded-2xl flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="font-['Syne'] text-base font-bold text-primary group-hover:text-white transition-colors">{person.avatarInitials}</span>
            </div>

            <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-['Syne'] text-base font-semibold text-primary truncate group-hover:text-accent transition-colors">{person.name}</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                        className="font-mono text-xs text-secondary hover:text-primary bg-elevated hover:bg-surface border border-dim rounded-lg px-2.5 py-1 transition-all flex items-center gap-1.5 outline-none shrink-0"
                        title="Copy Slack handle"
                    >
                        {copied ? <Check size={12} className="text-green-500" /> : <Hash size={12} />}
                        <span className={copied ? "text-green-500" : ""}>{copied ? 'Copied' : person.slackHandle}</span>
                    </button>
                </div>
                <div className="font-mono text-xs text-secondary mt-1 font-medium">
                    {person.role} <span className="text-muted mx-1">•</span> {person.team}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {person.expertise.map(exp => (
                        <span key={exp} className="bg-elevated border border-dim rounded-md px-2 py-0.5 font-mono text-[10px] text-muted font-medium shadow-sm">
                            {exp}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
