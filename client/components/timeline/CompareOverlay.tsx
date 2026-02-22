import React from 'react';
import { Background, BackgroundVariant, ReactFlow, ReactFlowProvider } from '@xyflow/react';
import { useTimeFilteredGraph } from '@/hooks/useTimeFilteredGraph';
import { nodeTypes } from './TimeAwareGraph';

interface CompareOverlayProps {
    primaryDate: Date;
    compareDate: Date;
}

export function CompareOverlay({ primaryDate, compareDate }: CompareOverlayProps) {
    const leftDate = primaryDate < compareDate ? primaryDate : compareDate;
    const rightDate = primaryDate < compareDate ? compareDate : primaryDate;

    // We display original passed primary/compare labels to match the date if needed, 
    // but the prompt says:
    // leftLabel = primaryDate < compareDate ? 'Primary' : 'Compare'
    const leftLabel = primaryDate < compareDate ? 'Primary' : 'Compare';
    const rightLabel = primaryDate < compareDate ? 'Compare' : 'Primary';

    const leftData = useTimeFilteredGraph(leftDate);
    const rightData = useTimeFilteredGraph(rightDate);

    // Nodes unique to leftDate
    const leftNodes = leftData.nodes.map(n => {
        if (!rightData.nodes.find(rn => rn.id === n.id)) {
            // Unique to left
            return {
                ...n,
                style: { ...(n.style || {}), boxShadow: '0 0 0 2px #6366F1', borderRadius: '12px' }
            };
        }
        return n;
    });

    // Nodes unique to rightDate
    const rightNodes = rightData.nodes.map(n => {
        if (!leftData.nodes.find(ln => ln.id === n.id)) {
            // Unique to right
            return {
                ...n,
                style: { ...(n.style || {}), boxShadow: '0 0 0 2px #F59E0B', borderRadius: '12px' }
            };
        }
        return n;
    });

    const monthDiff = Math.abs((rightDate.getFullYear() - leftDate.getFullYear()) * 12 + rightDate.getMonth() - leftDate.getMonth());

    const leftMonthYear = leftDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    const rightMonthYear = rightDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

    return (
        <div className="flex w-full h-full">
            {/* Left Panel */}
            <div className="flex-1 relative h-full">
                <ReactFlowProvider>
                    <ReactFlow
                        nodes={leftNodes}
                        edges={leftData.edges}
                        nodeTypes={nodeTypes}
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
                </ReactFlowProvider>

                <div className="absolute top-3 left-3 z-10 bg-surface/90 backdrop-blur-md border border-accent/30 border-l-[3px] rounded-xl px-3 py-1.5 font-mono text-xs text-primary shadow-sm pointer-events-none">
                    {leftMonthYear}  ·  {leftLabel}
                </div>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 font-mono text-[10px] text-muted pointer-events-none text-center">
                    Nodes outlined in blue exist only in this state
                </div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 relative h-full border-l-2 border-dim">
                <ReactFlowProvider>
                    <ReactFlow
                        nodes={rightNodes}
                        edges={rightData.edges}
                        nodeTypes={nodeTypes}
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
                </ReactFlowProvider>

                <div className="absolute top-3 left-3 z-10 bg-surface/90 backdrop-blur-md border border-amber-500/30 border-l-[3px] border-l-amber-500 rounded-xl px-3 py-1.5 font-mono text-xs text-primary shadow-sm pointer-events-none">
                    {rightMonthYear}  ·  {rightLabel}
                </div>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 font-mono text-[10px] text-muted pointer-events-none text-center">
                    Nodes outlined in amber appeared between these two dates
                </div>

                {/* Center Divider Badge */}
                <div className="absolute top-1/2 left-[-1px] -translate-x-1/2 -translate-y-1/2 z-30 bg-elevated border border-dim rounded-full px-3 py-1 font-mono text-xs text-secondary shadow-md pointer-events-none whitespace-nowrap">
                    {monthDiff} {monthDiff === 1 ? 'month' : 'months'} apart
                </div>
            </div>
        </div>
    );
}
