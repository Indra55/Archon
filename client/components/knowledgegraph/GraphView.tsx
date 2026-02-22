import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, useReactFlow, NodeTypes, BackgroundVariant, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SlidersHorizontal, Maximize2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// import dagre from '@dagrejs/dagre';
import { SERVICES, INFRA, EDGES, INITIAL_NODE_POSITIONS } from '@/data/knowledgeGraphMockData';
import { ServiceNode } from './nodes/ServiceNode';
import { GatewayNode } from './nodes/GatewayNode';
import { DatabaseNode } from './nodes/DatabaseNode';
import { QueueNode } from './nodes/QueueNode';
import { ChunkNode } from './nodes/ChunkNode';

const nodeTypes: NodeTypes = {
    service: ServiceNode,
    gateway: GatewayNode,
    database: DatabaseNode,
    queue: QueueNode,
    chunk: ChunkNode,
    function: ChunkNode,
    class: ChunkNode
};

interface GraphViewProps {
    spotlightNodeId: string | null;
    onNodeClick: (id: string) => void;
    onNodeDoubleClick: (id: string) => void;
    filteredServiceIds: string[];
    visibleNodeIds: Set<string>;
    isFilterPanelOpen: boolean;
    onToggleFilterPanel: () => void;
    isFilterActive: boolean;
    apiData?: { nodes: any[], edges: any[] } | null;
}

// const getLayoutedNodes = (nodes: any[], edges: any[]) => {
//     const g = new dagre.graphlib.Graph();
//     g.setDefaultEdgeLabel(() => ({}));
//     g.setGraph({ rankdir: 'TB', ranksep: 120, nodesep: 60 });
//
//     nodes.forEach(n => {
//         let width = 180;
//         let height = 72;
//         if (n.type === 'gateway') { width = 240; height = 52; }
//         else if (n.type === 'database') { width = 100; height = 88; }
//         else if (n.type === 'queue') { width = 100; height = 100; }
//         g.setNode(n.id, { width, height });
//     });
//
//     edges.forEach(e => g.setEdge(e.source, e.target));
//
//     dagre.layout(g);
//
//     return nodes.map(n => {
//         const pos = g.node(n.id);
//         return { ...n, position: { x: pos.x - pos.width / 2, y: pos.y - pos.height / 2 } };
//     });
// };


export function GraphView({
    spotlightNodeId,
    onNodeClick,
    onNodeDoubleClick,
    filteredServiceIds,
    visibleNodeIds,
    isFilterPanelOpen,
    onToggleFilterPanel,
    isFilterActive,
    apiData
}: GraphViewProps) {
    const { setCenter, fitView } = useReactFlow();

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    const buildNodes = useCallback(() => {
        if (apiData && apiData.nodes.length > 0) {
            // Group nodes by type for hierarchical layout
            const repos: any[] = [];
            const files: any[] = [];
            const chunks: any[] = [];

            apiData.nodes.forEach(n => {
                if (n.type === 'repository') repos.push(n);
                else if (n.type === 'file') files.push(n);
                else chunks.push(n);
            });

            const layoutNodes = (group: any[], yOffset: number, xSpacing: number, nodeType: string) => {
                const totalWidth = group.length * xSpacing;
                const startX = -(totalWidth / 2);
                return group.map((n, i) => {
                    let type = n.type;
                    if (n.type === 'file' || n.type === 'repository') {
                        type = 'service';
                    } else if (!(n.type in nodeTypes)) {
                        type = 'chunk';
                    }
                    return {
                        ...n,
                        type,
                        position: { x: startX + i * xSpacing, y: yOffset },
                        data: {
                            service: {
                                ...n.data,
                                health: n.data.status === 'active' ? 'healthy' : n.type === 'repository' ? 'healthy' : 'undocumented',
                                team: n.data.path || n.data.repo || nodeType,
                                totalEndpoints: 0
                            },
                            isSpotlit: n.id === spotlightNodeId,
                            isDimmed: visibleNodeIds.size > 0 && !visibleNodeIds.has(n.id),
                        }
                    };
                });
            };

            return [
                ...layoutNodes(repos, 0, 250, 'Repository'),
                ...layoutNodes(files, 180, 220, 'File'),
                ...layoutNodes(chunks, 360, 180, 'Chunk'),
            ];
        }

        const newNodes: any[] = [];
        // ... (existing logic for mock data)

        SERVICES.forEach(service => {
            newNodes.push({
                id: service.id,
                type: service.type === 'gateway' ? 'gateway' : 'service',
                position: INITIAL_NODE_POSITIONS[service.id] || { x: 0, y: 0 },
                data: {
                    service,
                    isSpotlit: service.id === spotlightNodeId,
                    isDimmed: visibleNodeIds.size > 0 && !visibleNodeIds.has(service.id),
                }
            });
        });

        INFRA.forEach(infra => {
            newNodes.push({
                id: infra.id,
                type: infra.type,
                position: INITIAL_NODE_POSITIONS[infra.id] || { x: 0, y: 0 },
                data: {
                    infra,
                    isDimmed: visibleNodeIds.size > 0 && !visibleNodeIds.has(infra.id),
                }
            });
        });

        return newNodes;
    }, [spotlightNodeId, visibleNodeIds, apiData]);

    const buildEdges = useCallback(() => {
        if (apiData && apiData.edges.length > 0) {
            return apiData.edges.map(edge => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                type: 'smoothstep',
                label: edge.label,
                labelStyle: { fontFamily: 'IBM Plex Mono', fontSize: 9, fill: '#44445A', background: 'transparent' },
                labelBgStyle: { fill: '#09090E', fillOpacity: 0.8 },
                style: {
                    stroke: 'rgba(37,37,53,0.8)',
                    strokeWidth: 1.5
                }
            }));
        }

        return EDGES.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: 'smoothstep',
            animated: edge.isAsync,
            label: edge.protocol,
            labelStyle: { fontFamily: 'IBM Plex Mono', fontSize: 9, fill: '#44445A', background: 'transparent' },
            labelBgStyle: { fill: '#09090E', fillOpacity: 0.8 },
            style: {
                stroke: edge.isAsync ? 'rgba(245,158,11,0.5)' : 'rgba(37,37,53,0.8)',
                strokeWidth: 1.5
            }
        }));
    }, [apiData]);

    useEffect(() => {
        const initialNodes = buildNodes();
        const initialEdges = buildEdges();
        // const layouted = getLayoutedNodes(initialNodes, initialEdges);
        setNodes(initialNodes);
        setEdges(initialEdges);

    }, [apiData, buildNodes, buildEdges, setNodes, setEdges]); // React to apiData arrival

    useEffect(() => {
        // Update data without relayouting
        setNodes(nds => nds.map(n => {
            let isSpotlit = false;
            let isDimmed = visibleNodeIds.size > 0 && !visibleNodeIds.has(n.id);

            if (n.type === 'service' || n.type === 'gateway') {
                isSpotlit = n.id === spotlightNodeId;
            }

            return {
                ...n,
                data: { ...n.data, isSpotlit, isDimmed }
            };
        }));
    }, [spotlightNodeId, visibleNodeIds, setNodes]);

    useEffect(() => {
        if (spotlightNodeId && nodes.length > 0) {
            const node = nodes.find(n => n.id === spotlightNodeId);
            if (node) {
                setCenter(node.position.x + 90, node.position.y + 36, { zoom: 1.4, duration: 600 });
            }
        }
    }, [spotlightNodeId, setCenter]);

    return (
        <>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={(_, node) => {
                    if (node.type === 'service' || node.type === 'gateway') {
                        onNodeClick(node.id);
                    }
                }}
                onNodeDoubleClick={(_, node) => {
                    if (node.type === 'service' || node.type === 'gateway') {
                        onNodeDoubleClick(node.id);
                    }
                }}
                fitView
                fitViewOptions={{ padding: 0.15 }}
                minZoom={0.3}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
            >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(37,37,53,0.8)" />
                <Controls style={{ background: 'rgba(17,17,25,0.9)', border: '1px solid #252535', borderRadius: 8 }} />
                <MiniMap
                    nodeColor={(node: any) => {
                        if (node.data?.service?.health === 'healthy') return '#10B981';
                        if (node.data?.service?.health === 'stale') return '#F59E0B';
                        if (node.data?.service?.health === 'undocumented') return '#EF4444';
                        if (node.type === 'database') return '#252535';
                        if (node.type === 'queue') return '#F59E0B';
                        return '#252535';
                    }}
                    style={{ background: '#111119', border: '1px solid #252535', borderRadius: 8 }}
                    maskColor="rgba(9,9,14,0.7)"
                    position="bottom-right"
                />
            </ReactFlow>

            <div className="absolute top-4 left-4 flex gap-2 z-10">
                <button
                    onClick={onToggleFilterPanel}
                    className={`flex items-center gap-2 font-mono text-xs rounded-lg px-3 py-1.5 transition-colors ${isFilterPanelOpen ? 'bg-[#1A1A1A] border border-[#6366F1] text-[#E5E5E5]' : 'bg-[#111] border border-[#2A2A2A] text-[#A1A1A1] hover:text-[#E5E5E5]'}`}
                >
                    <SlidersHorizontal size={12} className={isFilterPanelOpen ? 'text-[#E5E5E5]' : 'text-[#A1A1A1]'} />
                    Filters
                    {isFilterActive && <div className="w-1.5 h-1.5 bg-[#6366F1] rounded-full ml-1" />}
                </button>

                <button
                    onClick={() => fitView({ duration: 400, padding: 0.15 })}
                    className="bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-[#A1A1A1] hover:text-[#E5E5E5] transition-colors"
                >
                    <Maximize2 size={12} />
                </button>

                <button
                    onClick={() => {
                        // const layouted = getLayoutedNodes(nodes, edges);
                        // setNodes(layouted);
                        setTimeout(() => fitView({ duration: 400, padding: 0.15 }), 100);

                    }}
                    className="bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-[#A1A1A1] hover:text-[#E5E5E5] transition-colors"
                >
                    <RotateCcw size={12} />
                </button>

                <div className="bg-[#111]/60 backdrop-blur border border-[#2A2A2A] rounded-lg px-3 py-1.5 font-mono text-xs text-[#737373] flex items-center">
                    {apiData ? `${apiData.nodes.length} nodes` : `${visibleNodeIds.size > 0 ? visibleNodeIds.size : (SERVICES.length + INFRA.length)} of ${SERVICES.length + INFRA.length} nodes`}
                </div>
            </div>
        </>
    );
}
