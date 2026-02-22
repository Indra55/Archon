import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Download } from 'lucide-react';
import { AUDIT_LOG_ENTRIES } from '@/data/ciEnforcerMockData';
import { Policy } from '@/hooks/useCIEnforcer';
import { ToggleSwitch } from '../shared/ToggleSwitch';

interface PolicyManagerProps {
    policies: Policy[];
    onTogglePolicy: (id: string) => void;
    lastSavedPolicyId: string | null;
    driftSensitivity: 'low' | 'medium' | 'high';
    onDriftSensitivity: (s: 'low' | 'medium' | 'high') => void;
    auditLogEnabled: boolean;
    onToggleAuditLog: () => void;
    onViewAuditPR: (pr: number) => void;
}

export function PolicyManager({
    policies,
    onTogglePolicy,
    lastSavedPolicyId,
    driftSensitivity,
    onDriftSensitivity,
    onViewAuditPR
}: PolicyManagerProps) {

    const documentationPolicies = policies.filter(p => p.group === 'documentation');
    const architecturePolicies = policies.filter(p => p.group === 'architecture');
    const auditPolicies = policies.filter(p => p.group === 'audit');

    const detectArchDriftEnabled = policies.find(p => p.id === 'detect-arch-drift')?.enabled;

    const handleExportCSV = () => {
        const csvRows = ['TIMESTAMP,PR,VIOLATION,AUTHOR,TEAM,STATUS'];
        AUDIT_LOG_ENTRIES.forEach(entry => {
            csvRows.push(`${entry.timestamp},${entry.pr},"${entry.violation}","${entry.author}","${entry.team}",${entry.resolution}`);
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit_log.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportJSON = () => {
        const json = JSON.stringify(AUDIT_LOG_ENTRIES, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit_log.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const GroupCard = ({ title, subtitle, groupPolicies }: { title: string, subtitle: string, groupPolicies: Policy[] }) => (
        <div className="bg-[#111] border border-[#2A2A2A] rounded-2xl mb-6">
            <div className="px-6 py-4 border-b border-[#2A2A2A]">
                <h2 className="font-['Syne'] text-base font-semibold text-[#E5E5E5]">{title}</h2>
                <p className="font-mono text-xs text-[#737373] mt-0.5">{subtitle}</p>
            </div>
            <div>
                {groupPolicies.map(policy => (
                    <div key={policy.id} className="px-6 py-4 border-b border-[#2A2A2A] last:border-0 flex flex-col">
                        <div className="flex items-start justify-between gap-6">
                            <div className="flex-1">
                                <div className="font-mono text-sm text-[#E5E5E5] font-medium">{policy.label}</div>
                                <div className="font-mono text-xs text-[#A1A1A1] mt-1 leading-relaxed">{policy.description}</div>

                                <AnimatePresence>
                                    {lastSavedPolicyId === policy.id && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -4 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="font-mono text-xs text-green-500 mt-1.5 flex items-center gap-1"
                                        >
                                            <CheckCircle size={11} />
                                            Saved ✓
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="flex-shrink-0 pt-0.5">
                                <ToggleSwitch checked={policy.enabled} onChange={() => onTogglePolicy(policy.id)} />
                            </div>
                        </div>

                        {/* Architecture sensitivity control */}
                        {policy.id === 'detect-arch-drift' && (
                            <AnimatePresence>
                                {detectArchDriftEnabled && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-4 flex items-center gap-4">
                                            <span className="font-mono text-xs text-[#737373]">Drift sensitivity:</span>
                                            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-0.5 flex gap-0.5">
                                                {['low', 'medium', 'high'].map(level => {
                                                    const isActive = driftSensitivity === level;
                                                    return (
                                                        <div
                                                            key={level}
                                                            onClick={() => onDriftSensitivity(level as 'low' | 'medium' | 'high')}
                                                            className={`relative font-mono text-xs px-3 py-1.5 rounded-md cursor-pointer ${isActive ? 'text-[#E5E5E5] font-medium' : 'text-[#737373] hover:text-[#A1A1A1]'
                                                                }`}
                                                        >
                                                            {isActive && (
                                                                <motion.div
                                                                    layoutId="sensitivityBg"
                                                                    className="absolute inset-0 bg-[#0A0A0A] rounded-md"
                                                                    style={{ zIndex: 0 }}
                                                                />
                                                            )}
                                                            <span className="relative z-10 capitalize">{level}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="px-8 py-6 max-w-[760px]">
            <GroupCard
                title="Documentation Requirements"
                subtitle="Control what documentation must exist before a PR can merge."
                groupPolicies={documentationPolicies}
            />
            <GroupCard
                title="Architecture Standards"
                subtitle="Enforce consistency with registered ADRs and service design decisions."
                groupPolicies={architecturePolicies}
            />
            <GroupCard
                title="Audit & Notifications"
                subtitle="Configure logging, alerting, and external integrations."
                groupPolicies={auditPolicies}
            />

            <div className="bg-[#111] border border-[#2A2A2A] rounded-2xl">
                <div className="px-6 py-4 border-b border-[#2A2A2A] flex items-center justify-between">
                    <h2 className="font-['Syne'] text-base font-semibold text-[#E5E5E5]">Audit Log</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-1.5 text-[#A1A1A1] hover:text-[#E5E5E5] px-3 font-mono text-xs transition-colors"
                        >
                            <Download size={12} />
                            Export CSV
                        </button>
                        <button
                            onClick={handleExportJSON}
                            className="flex items-center gap-1.5 text-[#A1A1A1] hover:text-[#E5E5E5] px-3 font-mono text-xs transition-colors"
                        >
                            <Download size={12} />
                            Export JSON
                        </button>
                    </div>
                </div>

                <div className="w-full">
                    <div className="px-6 py-2 bg-[#1A1A1A] border-b border-[#2A2A2A] flex items-center font-mono text-[10px] uppercase tracking-widest text-[#737373]">
                        <div className="w-[160px]">TIMESTAMP</div>
                        <div className="w-[60px]">PR</div>
                        <div className="flex-1 min-w-[120px]">VIOLATION</div>
                        <div className="w-[80px]">AUTHOR</div>
                        <div className="w-[80px]">TEAM</div>
                        <div className="w-[80px]">STATUS</div>
                    </div>

                    {AUDIT_LOG_ENTRIES.map(entry => (
                        <div key={entry.id} className="px-6 py-3 border-b border-[#2A2A2A] last:border-0 flex items-center font-mono text-xs">
                            <div className="w-[160px] text-[#737373]">{entry.timestamp}</div>
                            <div
                                className="w-[60px] text-[#6366F1] cursor-pointer hover:underline"
                                onClick={() => onViewAuditPR(entry.pr)}
                            >
                                #{entry.pr}
                            </div>
                            <div className="flex-1 min-w-[120px] text-[#E5E5E5] truncate pr-4">{entry.violation}</div>
                            <div className="w-[80px] text-[#A1A1A1]">{entry.author}</div>
                            <div className="w-[80px] text-[#A1A1A1]">{entry.team}</div>
                            <div className="w-[80px] flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${entry.resolution === 'pending' ? 'bg-amber-500' : 'bg-green-500'}`} />
                                <span className={entry.resolution === 'pending' ? 'text-amber-500' : 'text-green-500 capitalize'}>
                                    {entry.resolution}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-6 py-3 font-mono text-xs text-[#737373]">
                    Showing 7 most recent violations. Export for full history.
                </div>
            </div>
        </div>
    );
}
