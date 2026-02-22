import React from 'react';
import { motion } from 'framer-motion';
import { EngineerRole, ROLES } from '@/data/onboardingMockData';

interface RoleSwitcherProps {
    onSelectRole: (role: EngineerRole) => void;
}

export function RoleSwitcher({ onSelectRole }: RoleSwitcherProps) {
    return (
        <div className="bg-[#0A0A0A] w-full flex flex-col items-center">
            <h2 className="font-['Syne'] text-4xl font-bold text-[#E5E5E5] mb-4 text-center tracking-tight">What's your role?</h2>
            <p className="font-mono text-base text-[#737373] mb-12 text-center max-w-xl leading-relaxed">
                Choose your role to receive a personalized learning path tailored to the services and artifacts you'll interact with most.
            </p>

            <div className="grid grid-cols-2 gap-6 max-w-4xl w-full">
                {ROLES.map((role, idx) => (
                    <motion.button
                        key={role.id}
                        className="group relative bg-[#11111A] border border-[#2A2A2A] rounded-3xl p-8 hover:border-[#6366F1]/50 hover:bg-[#151520] text-left outline-none transition-all duration-300 overflow-hidden shadow-sm"
                        whileHover={{ y: -4, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        onClick={() => onSelectRole(role.id)}
                    >
                        {/* Subtle highlight effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-5xl">{role.icon}</span>
                            <div className="bg-[#1A1A1A]/80 backdrop-blur border border-[#2A2A2A] rounded-full px-4 py-1.5 font-mono text-[11px] font-medium text-[#A1A1A1]">
                                {role.moduleIds.length} modules
                            </div>
                        </div>

                        <h3 className="font-['Syne'] text-2xl font-bold text-[#E5E5E5] mt-6 tracking-tight group-hover:text-[#6366F1] transition-colors">{role.label}</h3>

                        <p className="font-mono text-sm text-[#888] mt-3 leading-relaxed min-h-[40px]">
                            {role.description}
                        </p>

                        <div className="mt-8 flex items-center gap-2 overflow-hidden relative z-10">
                            {role.moduleIds.map((moduleId, circleIdx) => {
                                let colorClass = 'bg-[#2A2A2A] group-hover:bg-[#333]'; // default system-overview / ci-workflow
                                if (moduleId !== 'system-overview' && moduleId !== 'ci-workflow') {
                                    colorClass = 'bg-[#6366F1]/60 group-hover:bg-[#6366F1]';
                                }

                                return (
                                    <motion.div
                                        key={moduleId}
                                        className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${colorClass}`}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: circleIdx * 0.05 + 0.1 }}
                                    />
                                );
                            })}
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
