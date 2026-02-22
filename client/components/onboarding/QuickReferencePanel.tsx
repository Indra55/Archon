import React from 'react';
import { Users, Hash } from 'lucide-react';
import { EngineerRole, PEOPLE, CHANNELS } from '@/data/onboardingMockData';
import { PeopleCard } from './PeopleCard';

interface QuickReferencePanelProps {
    activeRole: EngineerRole | null;
    onNavigate: (path: string) => void;
}

export function QuickReferencePanel({ activeRole, onNavigate }: QuickReferencePanelProps) {
    if (!activeRole) return null;

    const relevantPeople = PEOPLE.filter(p => p.relevantRoles.includes(activeRole));
    const relevantChannels = CHANNELS.filter(c => c.relevantRoles.includes(activeRole));

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="bg-surface border border-dim rounded-3xl overflow-hidden shadow-xl">
                <div className="px-6 py-5 border-b border-dim flex items-center gap-3 bg-elevated">
                    <div className="bg-base shadow p-2 rounded-xl text-accent">
                        <Users size={16} />
                    </div>
                    <h2 className="font-['Syne'] text-base font-bold text-primary tracking-wide">People to Know</h2>
                </div>
                <div className="flex flex-col p-2">
                    {relevantPeople.map(person => (
                        <PeopleCard key={person.name} person={person} />
                    ))}
                </div>
            </div>

            <div className="bg-surface border border-dim rounded-3xl overflow-hidden shadow-xl">
                <div className="px-6 py-5 border-b border-dim flex items-center gap-3 bg-elevated">
                    <div className="bg-base shadow p-2 rounded-xl text-cyan-500">
                        <Hash size={16} />
                    </div>
                    <h2 className="font-['Syne'] text-base font-bold text-primary tracking-wide">Key Channels</h2>
                </div>
                <div className="flex flex-col p-2">
                    {relevantChannels.map(channel => (
                        <div key={channel.name} className="px-5 py-4 hover:bg-elevated rounded-xl transition-colors flex items-start gap-3">
                            <Hash size={14} className="text-muted flex-shrink-0 mt-1" />
                            <div className="flex flex-col">
                                <span className="font-mono text-sm text-primary font-semibold">{channel.name}</span>
                                <span className="font-mono text-[11px] text-muted mt-1 leading-relaxed">{channel.purpose}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
