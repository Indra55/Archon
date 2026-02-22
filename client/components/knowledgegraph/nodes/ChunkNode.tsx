import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';

export interface ChunkNodeData {
    label: string;
    summary?: string;
    type: string;
    isSpotlit?: boolean;
    isDimmed?: boolean;
}

export function ChunkNode({ data, selected }: { data: any; selected: boolean }) {
    const { isSpotlit, isDimmed } = data;
    const service = data.service || {};
    const label = service.label || service.name || 'Chunk';
    
    const isSelected = selected;

    const nodeStyle: React.CSSProperties = {
        opacity: isDimmed ? 0.3 : 1,
        pointerEvents: isDimmed ? 'none' : 'auto',
    };

    return (
        <motion.div
            className="relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div
                className={`w-[140px] p-2 rounded-lg bg-[#1A1A1A] border ${isSelected ? 'border-[#6366F1]' : 'border-[#333]'} transition-all duration-200`}
                style={nodeStyle}
            >
                <div className="font-mono text-[10px] font-medium text-[#E5E5E5] truncate">
                    {label}
                </div>
                {service.summary && (
                    <div className="font-mono text-[8px] text-[#737373] mt-1 line-clamp-2">
                        {service.summary}
                    </div>
                )}
            </div>

            <Handle type="target" position={Position.Top} className="bg-[#333]! border-none! w-1! h-1!" />
            <Handle type="source" position={Position.Bottom} className="bg-[#333]! border-none! w-1! h-1!" />
        </motion.div>
    );
}
