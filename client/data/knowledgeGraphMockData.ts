export interface ServiceDefinition {
    id: string;
    name: string;
    type: 'microservice' | 'gateway';
    team: string;
    language: string;
    health: 'healthy' | 'stale' | 'undocumented';
    docCoverage: number;          // 0–100
    apiCoverage: number;          // 0–100
    adrCoverage: number;          // 0–100
    lastUpdatedDays: number;      // days since last doc update
    totalEndpoints: number;
    missingArtifacts: string[];   // e.g. ["Runbook", "ADR-003"]
    upstreamCount: number;        // how many services call this one
    downstreamCount: number;      // how many services this one calls
    openIncidents: number;
    weeklyRequests: string;       // e.g. "1.2M"
    p99Latency: string;           // e.g. "84ms"
    errorRate: string;            // e.g. "0.3%"
    description: string;
    repositoryUrl: string;
}

export interface InfraDefinition {
    id: string;
    name: string;
    type: 'database' | 'queue';
    technology: string;           // e.g. "PostgreSQL", "Kafka"
    usedBy: string[];             // service IDs that use this infra
}

export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    protocol: string;             // "REST" | "gRPC" | "Event" | "SQL" | "ODM"
    callsPerDay: string;          // e.g. "~50k/day"
    isAsync: boolean;
}

export const SERVICES: ServiceDefinition[] = [
    {
        id: 'gateway',
        name: 'API Gateway',
        type: 'gateway',
        team: 'Platform',
        language: 'Node.js',
        health: 'healthy',
        docCoverage: 95,
        apiCoverage: 100,
        adrCoverage: 80,
        lastUpdatedDays: 1,
        totalEndpoints: 0,
        missingArtifacts: [],
        upstreamCount: 0,
        downstreamCount: 4,
        openIncidents: 0,
        weeklyRequests: '8.4M',
        p99Latency: '12ms',
        errorRate: '0.1%',
        description: 'Single ingress point for all external traffic. Handles routing, rate limiting, and auth token validation.',
        repositoryUrl: '#',
    },
    {
        id: 'auth',
        name: 'Auth Service',
        type: 'microservice',
        team: 'Platform',
        language: 'Node.js',
        health: 'healthy',
        docCoverage: 92,
        apiCoverage: 95,
        adrCoverage: 88,
        lastUpdatedDays: 3,
        totalEndpoints: 8,
        missingArtifacts: ['Runbook'],
        upstreamCount: 1,
        downstreamCount: 1,
        openIncidents: 0,
        weeklyRequests: '2.1M',
        p99Latency: '34ms',
        errorRate: '0.2%',
        description: 'Handles all authentication and session management. Issues JWT access tokens (15min) and opaque refresh tokens (30 days).',
        repositoryUrl: '#',
    },
    {
        id: 'payment',
        name: 'Payment Service',
        type: 'microservice',
        team: 'Payments',
        language: 'TypeScript',
        health: 'stale',
        docCoverage: 68,
        apiCoverage: 88,
        adrCoverage: 52,
        lastUpdatedDays: 14,
        totalEndpoints: 6,
        missingArtifacts: ['ADR-003', 'Runbook'],
        upstreamCount: 3,
        downstreamCount: 2,
        openIncidents: 0,
        weeklyRequests: '340K',
        p99Latency: '210ms',
        errorRate: '0.4%',
        description: 'Handles charge, refund, and subscription operations via Stripe gateway. Publishes payment events to the analytics pipeline.',
        repositoryUrl: '#',
    },
    {
        id: 'order',
        name: 'Order Service',
        type: 'microservice',
        team: 'Commerce',
        language: 'TypeScript',
        health: 'stale',
        docCoverage: 74,
        apiCoverage: 90,
        adrCoverage: 60,
        lastUpdatedDays: 7,
        totalEndpoints: 12,
        missingArtifacts: ['ADR-002'],
        upstreamCount: 1,
        downstreamCount: 2,
        openIncidents: 0,
        weeklyRequests: '620K',
        p99Latency: '95ms',
        errorRate: '0.3%',
        description: 'Manages the full order lifecycle from cart to fulfillment. Uses cursor-based pagination since the v2 migration.',
        repositoryUrl: '#',
    },
    {
        id: 'notification',
        name: 'Notification Service',
        type: 'microservice',
        team: 'Platform',
        language: 'Go',
        health: 'undocumented',
        docCoverage: 21,
        apiCoverage: 30,
        adrCoverage: 0,
        lastUpdatedDays: 30,
        totalEndpoints: 4,
        missingArtifacts: ['API Reference', 'ADR', 'Runbook'],
        upstreamCount: 1,
        downstreamCount: 0,
        openIncidents: 0,
        weeklyRequests: '180K',
        p99Latency: '48ms',
        errorRate: '0.6%',
        description: 'Dispatches email and push notifications triggered by order and payment events. Consumes from the events Kafka topic.',
        repositoryUrl: '#',
    },
    {
        id: 'analytics',
        name: 'Analytics Service',
        type: 'microservice',
        team: 'Data',
        language: 'Python',
        health: 'stale',
        docCoverage: 55,
        apiCoverage: 70,
        adrCoverage: 40,
        lastUpdatedDays: 10,
        totalEndpoints: 5,
        missingArtifacts: ['API Reference', 'Runbook'],
        upstreamCount: 1,
        downstreamCount: 0,
        openIncidents: 0,
        weeklyRequests: '90K',
        p99Latency: '320ms',
        errorRate: '0.2%',
        description: 'Consumes payment events from Kafka and aggregates revenue metrics. Powers the financial reporting dashboard.',
        repositoryUrl: '#',
    },
];

export const INFRA: InfraDefinition[] = [
    { id: 'db-auth', name: 'Auth DB', type: 'database', technology: 'PostgreSQL', usedBy: ['auth'] },
    { id: 'db-payment', name: 'Payment DB', type: 'database', technology: 'PostgreSQL', usedBy: ['payment'] },
    { id: 'db-order', name: 'Order DB', type: 'database', technology: 'MongoDB', usedBy: ['order'] },
    { id: 'kafka', name: 'Kafka', type: 'queue', technology: 'Kafka', usedBy: ['payment', 'order', 'notification', 'analytics'] },
    { id: 'redis', name: 'Redis', type: 'database', technology: 'Redis', usedBy: ['auth', 'payment'] },
];

export const EDGES: GraphEdge[] = [
    { id: 'e1', source: 'gateway', target: 'auth', protocol: 'REST', callsPerDay: '~300k/day', isAsync: false },
    { id: 'e2', source: 'gateway', target: 'order', protocol: 'REST', callsPerDay: '~89k/day', isAsync: false },
    { id: 'e3', source: 'gateway', target: 'payment', protocol: 'REST', callsPerDay: '~49k/day', isAsync: false },
    { id: 'e4', source: 'order', target: 'payment', protocol: 'gRPC', callsPerDay: '~88k/day', isAsync: false },
    { id: 'e5', source: 'order', target: 'notification', protocol: 'Event', callsPerDay: '~26k/day', isAsync: true },
    { id: 'e6', source: 'payment', target: 'analytics', protocol: 'Event', callsPerDay: '~49k/day', isAsync: true },
    { id: 'e7', source: 'auth', target: 'db-auth', protocol: 'SQL', callsPerDay: '~600k/day', isAsync: false },
    { id: 'e8', source: 'payment', target: 'db-payment', protocol: 'SQL', callsPerDay: '~100k/day', isAsync: false },
    { id: 'e9', source: 'order', target: 'db-order', protocol: 'ODM', callsPerDay: '~180k/day', isAsync: false },
    { id: 'e10', source: 'auth', target: 'redis', protocol: 'Cache', callsPerDay: '~2.1M/day', isAsync: false },
    { id: 'e11', source: 'payment', target: 'redis', protocol: 'Cache', callsPerDay: '~340k/day', isAsync: false },
    { id: 'e12', source: 'payment', target: 'kafka', protocol: 'Event', callsPerDay: '~49k/day', isAsync: true },
    { id: 'e13', source: 'order', target: 'kafka', protocol: 'Event', callsPerDay: '~26k/day', isAsync: true },
    { id: 'e14', source: 'notification', target: 'kafka', protocol: 'Event', callsPerDay: '~26k/day', isAsync: true },
    { id: 'e15', source: 'analytics', target: 'kafka', protocol: 'Event', callsPerDay: '~49k/day', isAsync: true },
];

export const TEAMS = ['All Teams', 'Platform', 'Payments', 'Commerce', 'Data'];

export const COVERAGE_TREND = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000)
        .toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    docCoverage: Math.round(62 + i * 0.37 + (Math.random() - 0.5) * 4),
    apiCoverage: Math.round(78 + i * 0.33 + (Math.random() - 0.5) * 3),
}));

export const RECENT_GRAPH_ACTIVITY = [
    { id: 1, type: 'added', text: 'Notification Service — push notification support added', time: '2d ago', serviceId: 'notification' },
    { id: 2, type: 'stale', text: 'Payment Service docs flagged as stale (14 days)', time: '1d ago', serviceId: 'payment' },
    { id: 3, type: 'updated', text: 'Auth Service — deviceId support documented', time: '3d ago', serviceId: 'auth' },
    { id: 4, type: 'missing', text: 'Analytics Service — API Reference still missing', time: '10d ago', serviceId: 'analytics' },
    { id: 5, type: 'updated', text: 'Order Service — pagination ADR created', time: '5d ago', serviceId: 'order' },
];

// Node positions for the graph layout (used as initial positions;
// dagre will recompute on first render)
export const INITIAL_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
    gateway: { x: 420, y: 40 },
    auth: { x: 80, y: 220 },
    order: { x: 420, y: 220 },
    payment: { x: 760, y: 220 },
    notification: { x: 80, y: 440 },
    analytics: { x: 760, y: 440 },
    'db-auth': { x: -120, y: 360 },
    'db-payment': { x: 960, y: 360 },
    'db-order': { x: 260, y: 440 },
    kafka: { x: 420, y: 580 },
    redis: { x: 80, y: 580 },
};
