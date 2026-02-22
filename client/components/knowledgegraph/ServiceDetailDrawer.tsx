import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDown, ArrowUp, AlertTriangle, Sparkles, Zap, Network, FileText, ShieldCheck, CheckCircle } from 'lucide-react';
import { SERVICES, EDGES } from '@/data/knowledgeGraphMockData';
import { HealthBar } from '../shared/HealthBar';
import { useRouter } from 'next/navigation';

interface ServiceDetailDrawerProps {
    serviceId: string;
    onClose: () => void;
    onNavigate: (path: string) => void;
}

export function ServiceDetailDrawer({ serviceId, onClose, onNavigate }: ServiceDetailDrawerProps) {
    const service = SERVICES.find(s => s.id === serviceId);

    if (!service) return null;

    const getHealthBadge = () => {
        switch (service.health) {
            case 'healthy':
                return <div className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-full px-2.5 py-1 font-mono text-xs font-bold">Healthy</div>;
            case 'stale':
                return <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full px-2.5 py-1 font-mono text-xs font-bold">Stale</div>;
            case 'undocumented':
                return <div className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-full px-2.5 py-1 font-mono text-xs font-bold">Undocumented</div>;
        }
    };

    const getProtocolColor = (protocol: string) => {
        switch (protocol) {
            case 'REST': return 'text-[#6366F1]';
            case 'gRPC': return 'text-purple-500';
            case 'Event': return 'text-amber-500';
            default: return 'text-[#737373]';
        }
    };

    const edges = EDGES.filter(e => e.source === service.id || e.target === service.id);

    const inferTemplate = (artifact: string) => {
        if (artifact.toLowerCase().includes('runbook')) return 'runbook';
        if (artifact.toLowerCase().startsWith('adr')) return 'adr';
        return 'api';
    };

    return (
        <motion.div
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-0 h-full w-[360px] bg-[#111] border-l border-[#2A2A2A] z-20 overflow-y-auto flex flex-col"
        >
            <div className="px-5 py-4 border-b border-[#2A2A2A]">
                <div className="flex items-center gap-3">
                    <h2 className="font-['Syne'] text-base font-bold text-[#E5E5E5] flex-1">{service.name}</h2>
                    {getHealthBadge()}
                    <button onClick={onClose} className="text-[#A1A1A1] hover:text-[#E5E5E5] transition-colors ml-2">
                        <X size={20} />
                    </button>
                </div>
                <div className="font-mono text-xs text-[#737373] mt-1">
                    {service.team} Team · {service.language} · Last updated {service.lastUpdatedDays}d ago
                </div>
            </div>

            <div className="px-5 py-4 border-b border-[#2A2A2A]">
                <div className="font-mono text-xs uppercase tracking-widest text-[#737373] mb-3">Health Scores</div>
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3 py-1.5">
                        <span className="font-mono text-xs text-[#A1A1A1] w-[100px] flex-shrink-0">Doc Coverage</span>
                        <HealthBar value={service.docCoverage} height={4} animateOnMount={true} showLabel={false} />
                        <span className="font-mono text-xs text-[#737373] ml-1 flex-shrink-0 w-[32px] text-right">{service.docCoverage}%</span>
                    </div>
                    <div className="flex items-center gap-3 py-1.5">
                        <span className="font-mono text-xs text-[#A1A1A1] w-[100px] flex-shrink-0">API Coverage</span>
                        <HealthBar value={service.apiCoverage} height={4} animateOnMount={true} showLabel={false} />
                        <span className="font-mono text-xs text-[#737373] ml-1 flex-shrink-0 w-[32px] text-right">{service.apiCoverage}%</span>
                    </div>
                    <div className="flex items-center gap-3 py-1.5">
                        <span className="font-mono text-xs text-[#A1A1A1] w-[100px] flex-shrink-0">ADR Coverage</span>
                        <HealthBar value={service.adrCoverage} height={4} animateOnMount={true} showLabel={false} />
                        <span className="font-mono text-xs text-[#737373] ml-1 flex-shrink-0 w-[32px] text-right">{service.adrCoverage}%</span>
                    </div>
                </div>
            </div>

            <div className="px-5 py-4 border-b border-[#2A2A2A]">
                <div className="font-mono text-xs uppercase tracking-widest text-[#737373] mb-3">This Week</div>
                <div className="flex gap-3">
                    <div className="bg-[#1A1A1A] rounded-xl p-3 flex-1 text-center">
                        <div className="font-['Syne'] text-sm font-bold text-[#E5E5E5]">{service.weeklyRequests}</div>
                        <div className="font-mono text-[9px] uppercase text-[#737373] mt-0.5">REQUESTS</div>
                    </div>
                    <div className="bg-[#1A1A1A] rounded-xl p-3 flex-1 text-center">
                        <div className="font-['Syne'] text-sm font-bold text-[#E5E5E5]">{service.p99Latency}</div>
                        <div className="font-mono text-[9px] uppercase text-[#737373] mt-0.5">P99 LATENCY</div>
                    </div>
                    <div className="bg-[#1A1A1A] rounded-xl p-3 flex-1 text-center">
                        <div className={`font-['Syne'] text-sm font-bold ${parseFloat(service.errorRate) > 0.5 ? 'text-red-500' : 'text-[#E5E5E5]'}`}>{service.errorRate}</div>
                        <div className="font-mono text-[9px] uppercase text-[#737373] mt-0.5">ERROR RATE</div>
                    </div>
                </div>
            </div>

            <div className="px-5 py-4 border-b border-[#2A2A2A]">
                <div className="font-mono text-xs uppercase tracking-widest text-[#737373] mb-3">Connections</div>
                <div className="flex items-center gap-2 py-1">
                    <ArrowUp size={12} className="text-[#737373]" />
                    <span className="font-mono text-xs text-[#A1A1A1]">{service.upstreamCount} services call this</span>
                </div>
                <div className="flex items-center gap-2 py-1 mb-2">
                    <ArrowDown size={12} className="text-[#737373]" />
                    <span className="font-mono text-xs text-[#A1A1A1]">calls {service.downstreamCount} services</span>
                </div>

                <div className="mt-3 flex flex-col gap-1]">
                    {edges.map(edge => (
                        <div key={edge.id} className="font-mono text-[10px] text-[#737373]">
                            {edge.source === service.id ? (
                                <span>This &rarr; {edge.target}</span>
                            ) : (
                                <span>{edge.source} &rarr; This</span>
                            )}
                            {' '}via{' '}
                            <span className={getProtocolColor(edge.protocol)}>{edge.protocol}</span>
                            {' '}({edge.callsPerDay})
                        </div>
                    ))}
                </div>
            </div>

            {service.missingArtifacts.length > 0 && (
                <div className="px-5 py-4 border-b border-[#2A2A2A]">
                    <div className="font-mono text-xs uppercase tracking-widest text-[#737373] mb-3">Missing Artifacts</div>
                    {service.missingArtifacts.map(artifact => (
                        <div key={artifact} className="flex items-center gap-2 py-1.5">
                            <AlertTriangle size={12} className="text-amber-500" />
                            <span className="font-mono text-xs text-amber-500">{artifact}</span>
                            <span
                                onClick={() => onNavigate(`/dashboard/doc-generator?service=${service.id}&template=${inferTemplate(artifact)}`)}
                                className="font-mono text-[10px] text-[#6366F1] ml-auto cursor-pointer hover:underline"
                            >
                                &rarr; Create
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="px-5 py-4 border-b border-[#2A2A2A]">
                <p className="font-mono text-xs text-[#A1A1A1] leading-relaxed">
                    {service.description}
                </p>
            </div>

            <div className="px-5 py-4 flex flex-col gap-2 mb-8">
                <button
                    onClick={() => onNavigate(`/dashboard/doc-generator?service=${service.id}`)}
                    className="bg-[#6366F1] hover:bg-[#5558e6] text-white rounded-lg px-4 py-2.5 font-mono text-sm w-full flex items-center justify-center gap-2 transition-colors"
                >
                    <Sparkles size={14} />
                    Fix with AI &rarr;
                </button>

                <button
                    onClick={() => onNavigate(`/dashboard/what-if?scenario=${encodeURIComponent('What happens if ' + service.name + ' goes down')}`)}
                    className="bg-[#111] hover:bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 font-mono text-sm w-full flex items-center justify-center gap-2 text-[#E5E5E5] transition-colors"
                >
                    <Zap size={14} className="text-[#A1A1A1]" />
                    Analyze in What-If &rarr;
                </button>

                <button
                    onClick={() => onNavigate(`/dashboard/ci-enforcer?highlight=${service.id}`)}
                    className="font-mono text-xs text-[#A1A1A1] hover:text-[#E5E5E5] underline cursor-pointer text-center mt-1 w-full p-2 transition-colors"
                >
                    View in CI Enforcer &rarr;
                </button>
            </div>
        </motion.div>
    );
}
