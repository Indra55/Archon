import { useMemo } from 'react';
import { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react';
import { SERVICES, INFRA, EDGES, TIMELINE_EVENTS } from '@/data/timelineMockData';
import { INITIAL_NODE_POSITIONS } from '@/data/knowledgeGraphMockData';

export interface TimeFilteredGraphResult {
    visibleServiceIds: Set<string>;
    visibleInfraIds: Set<string>;
    visibleEdgeIds: Set<string>;
    newServiceIds: Set<string>;
    nodes: ReactFlowNode[];
    edges: ReactFlowEdge[];
}

export function useTimeFilteredGraph(
    date: Date,
    spotlightServiceId?: string
): TimeFilteredGraphResult {
    return useMemo(() => {
        const visibleServiceIds = new Set<string>();
        const newServiceIds = new Set<string>();

        const currentDateStr = date.toISOString().split('T')[0];

        // Determine visible services
        TIMELINE_EVENTS.forEach(event => {
            if (event.type === 'service_added' && event.serviceId) {
                const eventDate = new Date(event.date);
                if (eventDate <= date) {
                    visibleServiceIds.add(event.serviceId);
                }
                if (event.date === currentDateStr) {
                    newServiceIds.add(event.serviceId);
                }
            }
        });

        const visibleInfraIds = new Set<string>();
        INFRA.forEach(infra => {
            const isVisible = infra.usedBy.some(serviceId => visibleServiceIds.has(serviceId));
            if (isVisible) {
                visibleInfraIds.add(infra.id);
            }
        });

        const visibleEdgeIds = new Set<string>();
        const newEdgeKeys = new Set<string>();

        // An edge is visible if its source AND target are visible
        EDGES.forEach(edge => {
            const sourceVisible = visibleServiceIds.has(edge.source) || visibleInfraIds.has(edge.source);
            const targetVisible = visibleServiceIds.has(edge.target) || visibleInfraIds.has(edge.target);
            if (sourceVisible && targetVisible) {
                const edgeId = `${edge.source}-${edge.target}`;
                visibleEdgeIds.add(edgeId);

                // Edge is new if either source or target newly appeared today
                if (newServiceIds.has(edge.source) || newServiceIds.has(edge.target)) {
                    newEdgeKeys.add(edgeId);
                }
            }
        });

        const nodes: ReactFlowNode[] = [];

        // Add visible services
        SERVICES.forEach(service => {
            if (visibleServiceIds.has(service.id)) {
                nodes.push({
                    id: service.id,
                    type: service.type === 'gateway' ? 'gateway' : 'service',
                    position: INITIAL_NODE_POSITIONS[service.id] || { x: 0, y: 0 },
                    data: {
                        service,
                        isNew: newServiceIds.has(service.id),
                        isDimmed: false,
                        isSpotlit: service.id === spotlightServiceId,
                        isSelected: false
                    }
                });
            }
        });

        // Add visible infra
        INFRA.forEach(infra => {
            if (visibleInfraIds.has(infra.id)) {
                nodes.push({
                    id: infra.id,
                    type: infra.type,
                    position: INITIAL_NODE_POSITIONS[infra.id] || { x: 0, y: 0 },
                    data: {
                        infra,
                        isDimmed: false,
                        isNew: false
                    }
                });
            }
        });

        const edges: ReactFlowEdge[] = [];
        EDGES.forEach(edge => {
            const edgeId = `${edge.source}-${edge.target}`;
            if (visibleEdgeIds.has(edgeId)) {
                const isNew = newEdgeKeys.has(edgeId);
                edges.push({
                    id: edgeId,
                    source: edge.source,
                    target: edge.target,
                    type: 'default',
                    animated: edge.isAsync || false,
                    className: isNew ? 'edge-draw-on' : '',
                    style: {
                        stroke: edge.isAsync ? '#F59E0B' : '#444',
                        strokeWidth: edge.isAsync ? 2 : 1.5,
                    }
                });
            }
        });

        return {
            visibleServiceIds,
            visibleInfraIds,
            visibleEdgeIds,
            newServiceIds,
            nodes,
            edges
        };
    }, [date, spotlightServiceId]);
}
