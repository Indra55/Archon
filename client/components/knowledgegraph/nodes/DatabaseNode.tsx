import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { InfraDefinition } from '@/data/knowledgeGraphMockData';

export interface DatabaseNodeData {
    infra: InfraDefinition;
    isDimmed: boolean;
    isNew?: boolean;
}

export function DatabaseNode({ data, selected }: { data: DatabaseNodeData; selected: boolean }) {
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

    let Icon = Database;
    if (infra.technology === 'Redis') Icon = Cpu;

    return (
        <motion.div
            className={`relative w-[100px] h-[88px] ${isDimmed ? 'opacity-20 pointer-events-none' : ''}`}
            initial={animateNew ? { scale: 0, opacity: 0 } : false}
            animate={animateNew ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
            transition={animateNew ? { duration: 0.4, ease: [0.16, 1, 0.3, 1] } : {}}
        >
            <div className="absolute top-0 w-full h-[24px] rounded-[50%] bg-[#1A1A1A] border border-[#2A2A2A] z-10" />
            <div className={`absolute top-[12px] w-full h-[64px] bg-[#1A1A1A] border-x border-b border-[#2A2A2A] ${isSelected ? 'border-[#6366F1] shadow-[0_0_0_2px_rgba(99,102,241,0.2)]' : ''}`} />
            <div className="absolute bottom-0 w-full h-[24px] rounded-[50%] bg-[#1A1A1A] border border-[#2A2A2A]" />

            <div className="absolute inset-0 flex flex-col justify-center items-center z-20">
                <Icon size={16} className="text-[#A1A1A1]" />
                <span className="font-mono text-[9px] text-[#737373] mt-1 text-center truncate px-2 w-full">{infra.name}</span>
            </div>

            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
        </motion.div>
    );
}
