import React, { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Background, BackgroundVariant, ReactFlow, ReactFlowProvider, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTimeFilteredGraph } from '@/hooks/useTimeFilteredGraph';
import { TIMELINE_EVENTS } from '@/data/timelineMockData';
import { ServiceNode } from '../knowledgegraph/nodes/ServiceNode';
import { GatewayNode } from '../knowledgegraph/nodes/GatewayNode';
import { DatabaseNode } from '../knowledgegraph/nodes/DatabaseNode';
import { QueueNode } from '../knowledgegraph/nodes/QueueNode';

export const nodeTypes = {
    service: ServiceNode,
    gateway: GatewayNode,
    database: DatabaseNode,
    queue: QueueNode,
};

interface TimeAwareGraphProps {
    currentDate: Date;
    isCompareMode: boolean;
    onNodeClick: (serviceId: string) => void;
}

function TimelineGraphCanvas({ currentDate, onNodeClick }: { currentDate: Date, onNodeClick: (id: string) => void }) {
    const { nodes: initialNodes, edges: initialEdges } = useTimeFilteredGraph(currentDate);

    // We can just pass nodes directly to ReactFlow if we don't need to manually manipulate them via useNodesState
    return (
        <ReactFlow
            nodes={initialNodes}
            edges={initialEdges}
            nodeTypes={nodeTypes}
            onNodeClick={(e, node) => onNodeClick(node.id)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            className="bg-base"
            minZoom={0.1}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            proOptions={{ hideAttribution: true }}
        >
            <Background color="#222" gap={20} variant={BackgroundVariant.Dots} />
        </ReactFlow>
    );
}

export function TimeAwareGraph({ currentDate, isCompareMode, onNodeClick }: TimeAwareGraphProps) {
    const monthYear = new Date(currentDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long'
    });

    const lastEvent = useMemo(() => {
        const pastEvents = TIMELINE_EVENTS.filter(e => new Date(e.date) <= currentDate);
        // last event in original sorted order (which is chronological)
        return pastEvents[pastEvents.length - 1];
    }, [currentDate]);

    return (
        <div className="w-full h-full relative">
            <ReactFlowProvider>
                <TimelineGraphCanvas currentDate={currentDate} onNodeClick={onNodeClick} />
            </ReactFlowProvider>

            <div className="absolute top-3 right-3 z-10 bg-surface/90 backdrop-blur-md border border-dim rounded-xl px-4 py-2 flex flex-col items-end pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={monthYear}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-end"
                    >
                        <span className="font-['Syne'] text-xl font-bold text-primary">{monthYear}</span>
                    </motion.div>
                </AnimatePresence>
                <div className="font-mono text-xs text-muted max-w-[250px] truncate">
                    {lastEvent ? lastEvent.title.substring(0, 32) + (lastEvent.title.length > 32 ? '...' : '') : 'Initial state'}
                </div>
            </div>
        </div>
    );
}
