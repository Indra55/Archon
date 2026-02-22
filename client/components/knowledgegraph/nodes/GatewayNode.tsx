import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { ServiceDefinition } from '@/data/knowledgeGraphMockData';

export interface GatewayNodeData {
    service: ServiceDefinition;
    isSpotlit: boolean;
    isDimmed: boolean;
    isNew?: boolean;
}

export function GatewayNode({ data, selected }: { data: GatewayNodeData; selected: boolean }) {
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

    const nodeStyle: React.CSSProperties = {
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.06) 100%)',
        border: `1.5px solid ${isSelected || isSpotlit ? '#6366F1' : 'rgba(99,102,241,0.4)'}`,
        boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
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
            <div
                className="w-[240px] h-[52px] rounded-xl flex items-center justify-center gap-2 px-4 transition-all duration-200 ease-in-out"
                style={nodeStyle}
            >
                <Globe size={14} className="text-[#6366F1]" />
                <span className="font-['Syne'] text-sm font-bold text-[#E5E5E5]">{service.name}</span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping ml-auto" style={{ animationDuration: '3s' }} />
            </div>

            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
            <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
        </motion.div>
    );
}
