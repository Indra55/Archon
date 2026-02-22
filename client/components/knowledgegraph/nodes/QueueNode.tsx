import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { InfraDefinition } from '@/data/knowledgeGraphMockData';

export interface QueueNodeData {
    infra: InfraDefinition;
    isDimmed: boolean;
    isNew?: boolean;
}

export function QueueNode({ data, selected }: { data: QueueNodeData; selected: boolean }) {
    const { infra, isDimmed, isNew } = data;
    const isSelected = selected;
    const [animateNew, setAnimateNew] = React.useState(isNew);

    React.useEffect(() => {
        if (isNew) {
            setAnimateNew(true);
            const t = setTimeout(() => setAnimateNew(false), 600);
            return () => clearTimeout(t);
        }
    }, [isNew]);

    return (
        <motion.div
            className={`relative w-[100px] h-[100px] overflow-hidden ${isDimmed ? 'opacity-20 pointer-events-none' : ''}`}
            initial={animateNew ? { scale: 0, opacity: 0 } : false}
            animate={animateNew ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
            transition={animateNew ? { duration: 0.4, ease: [0.16, 1, 0.3, 1] } : {}}
        >
            <div
                className={`absolute inset-0 bg-[#1A1A1A] border ${isSelected ? 'border-[#6366F1] shadow-[0_0_0_2px_rgba(99,102,241,0.2)]' : 'border-amber-500/40'} rounded-lg`}
                style={{ transform: 'rotate(45deg) scale(0.7)' }}
            />

            <div className="absolute inset-0 flex flex-col justify-center items-center">
                <Layers size={18} className="text-amber-500" />
                <span className="font-mono text-[9px] text-[#737373] mt-1 truncate px-2 text-center w-full">{infra.name}</span>
            </div>

            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
            <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
        </motion.div>
    );
}
