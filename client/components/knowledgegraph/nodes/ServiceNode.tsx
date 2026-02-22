import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import { ServiceDefinition } from '@/data/knowledgeGraphMockData';

export interface ServiceNodeData {
    service: ServiceDefinition;
    isSpotlit: boolean;
    isDimmed: boolean;
    isSelected?: boolean;
    isNew?: boolean;
}

export function ServiceNode({ data, selected }: { data: ServiceNodeData; selected: boolean }) {
    const { service, isSpotlit, isDimmed, isNew } = data;
    const isSelected = selected;
    const [animateNew, setAnimateNew] = React.useState(isNew);

    React.useEffect(() => {
        if (isNew) {
            setAnimateNew(true);
            const t = setTimeout(() => setAnimateNew(false), 600);
            return () => clearTimeout(t);
        }
    }, [isNew]);

    let borderColorClass = '';
    switch (service.health) {
        case 'healthy':
            borderColorClass = 'border-green-500/40';
            break;
        case 'stale':
            borderColorClass = 'border-amber-500/40';
            break;
        case 'undocumented':
            borderColorClass = 'border-red-500/40';
            break;
    }

    const boxShadow = isSelected ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none';
    const borderFocusClass = isSelected || isSpotlit ? 'border-[#6366F1]' : borderColorClass;

    const nodeStyle: React.CSSProperties = {
        boxShadow,
        opacity: isDimmed ? 0.2 : 1,
        pointerEvents: isDimmed ? 'none' : 'auto',
    };

    return (
        <motion.div
            className="relative"
            initial={animateNew ? { scale: 0, opacity: 0 } : false}
            animate={animateNew ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
            transition={animateNew ? { duration: 0.4, ease: [0.16, 1, 0.3, 1] } : {}}
        >
            {isSpotlit && (
                <motion.div
                    animate={{ opacity: [1, 0.3, 1], scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute border-2 border-[#6366F1] rounded-[14px] pointer-events-none"
                    style={{ width: '200px', height: '92px', top: '-10px', left: '-10px' }}
                />
            )}

            <div
                className={`w-[180px] h-[72px] rounded-xl bg-[#111] border-[1.5px] ${borderFocusClass} transition-all duration-200 ease-in-out`}
                style={nodeStyle}
            >
                <div className="px-3 pt-2.5 flex items-center justify-between">
                    <div className="font-mono text-xs font-semibold text-[#E5E5E5] truncate flex-1">
                        {service.name}
                    </div>
                    <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ml-2 ${service.health === 'healthy' ? 'bg-green-500' :
                            service.health === 'stale' ? 'bg-amber-500 animate-pulse' :
                                'bg-red-500 animate-pulse'
                            }`}
                    />
                </div>

                <div className="px-3 pb-2.5 flex items-center justify-between mt-1">
                    <div className="font-mono text-[10px] text-[#737373] truncate flex-1">
                        {service.team}
                    </div>
                    <div className="bg-[#1A1A1A] rounded px-1.5 py-0.5 font-mono text-[9px] text-[#737373] flex-shrink-0">
                        {service.totalEndpoints} APIs
                    </div>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
            <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
        </motion.div>
    );
}
