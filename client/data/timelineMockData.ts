export type EventType =
    | 'service_added'
    | 'infra_added'
    | 'incident'
    | 'adr'
    | 'docs'
    | 'refactor'
    | 'milestone'

export interface TimelineEvent {
    id: string
    date: string                 // ISO date string "YYYY-MM-DD"
    type: EventType
    title: string
    detail: string               // longer description shown in tooltip/drawer
    serviceId?: string           // which service this event relates to
    infraId?: string
    severity?: 'critical' | 'high' | 'medium' | 'low'
    resolvedDate?: string        // for incidents — when it was resolved
    prNumber?: number            // for refactors and docs
    author?: string
}

export const TIMELINE_EVENTS: TimelineEvent[] = [
    {
        id: 'e1',
        date: '2023-01-15',
        type: 'service_added',
        title: 'Auth Service created',
        detail: 'Auth Service bootstrapped with basic JWT login and logout endpoints. PostgreSQL provisioned as the user store.',
        serviceId: 'auth',
        author: '@sarah',
    },
    {
        id: 'e2',
        date: '2023-01-15',
        type: 'infra_added',
        title: 'Auth DB provisioned',
        detail: 'PostgreSQL instance provisioned for the Auth Service user and session store.',
        infraId: 'db-auth',
        author: '@sarah',
    },
    {
        id: 'e3',
        date: '2023-01-20',
        type: 'infra_added',
        title: 'Redis provisioned',
        detail: 'Redis cluster provisioned for session caching and token blacklisting, shared between Auth and Payment services.',
        infraId: 'redis',
        author: '@sarah',
    },
    {
        id: 'e4',
        date: '2023-02-10',
        type: 'adr',
        title: 'ADR-001 · JWT token strategy',
        detail: 'Decided to use short-lived JWT access tokens (15min) paired with long-lived opaque refresh tokens (30 days). Rationale: minimises blast radius of token theft.',
        serviceId: 'auth',
        author: '@sarah',
    },
    {
        id: 'e5',
        date: '2023-03-05',
        type: 'service_added',
        title: 'API Gateway introduced',
        detail: 'API Gateway bootstrapped as the single ingress point for all external traffic. Handles routing, rate limiting, and auth token forwarding.',
        serviceId: 'gateway',
        author: '@mike',
    },
    {
        id: 'e6',
        date: '2023-06-10',
        type: 'service_added',
        title: 'Payment Service added',
        detail: 'Payment Service introduced to handle charges, refunds, and subscription billing via Stripe. PostgreSQL provisioned as the payment store.',
        serviceId: 'payment',
        author: '@dev',
    },
    {
        id: 'e7',
        date: '2023-06-10',
        type: 'infra_added',
        title: 'Payment DB provisioned',
        detail: 'PostgreSQL instance provisioned for the Payment Service.',
        infraId: 'db-payment',
        author: '@dev',
    },
    {
        id: 'e8',
        date: '2023-08-05',
        type: 'incident',
        title: 'INC-042 · Auth Service outage — 4hrs',
        detail: 'Redis connection pool exhaustion caused the Auth Service to fail all token validation requests. 100% of authenticated endpoints returned 401 for 4 hours. Root cause: missing connection pool limit configuration.',
        serviceId: 'auth',
        severity: 'critical',
        resolvedDate: '2023-08-05',
        author: '@sarah',
    },
    {
        id: 'e9',
        date: '2023-08-12',
        type: 'refactor',
        title: 'Auth — connection pool hardening',
        detail: 'PR #1620: Added max connection pool limits, circuit breaker pattern, and Redis health check endpoint. Also added runbook entry for this failure mode.',
        serviceId: 'auth',
        prNumber: 1620,
        author: '@sarah',
    },
    {
        id: 'e10',
        date: '2023-10-12',
        type: 'service_added',
        title: 'Order Service added',
        detail: 'Order Service introduced to manage the full order lifecycle from cart submission to fulfillment. MongoDB provisioned as the order store.',
        serviceId: 'order',
        author: '@raj',
    },
    {
        id: 'e11',
        date: '2023-10-12',
        type: 'infra_added',
        title: 'Order DB provisioned',
        detail: 'MongoDB instance provisioned for the Order Service order and cart store.',
        infraId: 'db-order',
        author: '@raj',
    },
    {
        id: 'e12',
        date: '2023-11-20',
        type: 'docs',
        title: 'Payment API Reference overhauled',
        detail: 'PR #1710: Complete rewrite of the Payment Service API Reference to cover all 6 endpoints, error codes, and idempotency guidance.',
        serviceId: 'payment',
        prNumber: 1710,
        author: '@dev',
    },
    {
        id: 'e13',
        date: '2024-01-08',
        type: 'service_added',
        title: 'Notification Service added',
        detail: 'Notification Service bootstrapped to handle email and push notifications triggered by order and payment events via Kafka.',
        serviceId: 'notification',
        author: '@sarah',
    },
    {
        id: 'e14',
        date: '2024-01-15',
        type: 'infra_added',
        title: 'Kafka cluster provisioned',
        detail: 'Kafka cluster provisioned as the shared async event bus for Payment, Order, Notification, and Analytics services.',
        infraId: 'kafka',
        author: '@mike',
    },
    {
        id: 'e15',
        date: '2024-02-14',
        type: 'incident',
        title: 'INC-067 · Payment timeout storm — 2hrs',
        detail: 'Stripe gateway latency spike caused cascading timeouts in the Payment Service. Order Service downstream failures created a backlog of 3,400 unconfirmed orders. Root cause: no circuit breaker on the Stripe HTTP client.',
        serviceId: 'payment',
        severity: 'critical',
        resolvedDate: '2024-02-14',
        author: '@dev',
    },
    {
        id: 'e16',
        date: '2024-02-20',
        type: 'refactor',
        title: 'Payment — Stripe circuit breaker added',
        detail: 'PR #1847: Added opossum circuit breaker to the Stripe HTTP client. Also introduced exponential backoff retry logic and a /health/stripe status endpoint.',
        serviceId: 'payment',
        prNumber: 1847,
        author: '@dev',
    },
    {
        id: 'e17',
        date: '2024-04-03',
        type: 'service_added',
        title: 'Analytics Service added',
        detail: 'Analytics Service introduced to consume payment events from Kafka and aggregate revenue metrics for the financial reporting dashboard.',
        serviceId: 'analytics',
        author: '@ananya',
    },
    {
        id: 'e18',
        date: '2024-06-01',
        type: 'adr',
        title: 'ADR-004 · Event-driven payment pipeline',
        detail: 'Formalised the decision to use Kafka for async event propagation from Payment to Analytics and Notification. Rationale: decoupling, replay capability, and independent scaling.',
        serviceId: 'payment',
        author: '@dev',
    },
    {
        id: 'e19',
        date: '2024-09-15',
        type: 'milestone',
        title: 'v2.0 · Full microservices migration complete',
        detail: 'All six services are running independently with dedicated datastores. The last monolith module (billing) has been extracted into the Payment Service.',
        author: '@mike',
    },
    {
        id: 'e20',
        date: '2025-01-10',
        type: 'refactor',
        title: 'Order — cursor pagination migration',
        detail: 'PR #1845: Migrated GET /v1/orders from offset to cursor-based pagination. P99 latency reduced from 4s to 180ms at scale.',
        serviceId: 'order',
        prNumber: 1845,
        author: '@raj',
    },
    {
        id: 'e21',
        date: '2025-03-22',
        type: 'docs',
        title: 'Auth — deviceId support documented',
        detail: 'PR #1846: Updated Auth Service API Reference to cover the new deviceId parameter and refresh token lifecycle.',
        serviceId: 'auth',
        prNumber: 1846,
        author: '@sarah',
    },
]

// Map event types to display colors — used on dots, pills, and event cards
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
    service_added: '#6366F1',   // accent
    infra_added: '#8B8BAA',   // secondary
    incident: '#EF4444',   // red
    adr: '#A855F7',   // purple
    docs: '#10B981',   // green
    refactor: '#F59E0B',   // amber
    milestone: '#06B6D4',   // cyan
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
    service_added: 'Service Added',
    infra_added: 'Infrastructure',
    incident: 'Incident',
    adr: 'ADR',
    docs: 'Documentation',
    refactor: 'Refactor',
    milestone: 'Milestone',
}

// Which event types to show as pills in the EventStrip (major events only)
export const MAJOR_EVENT_TYPES: EventType[] = [
    'service_added', 'incident', 'milestone',
]

// Re-export Knowledge Graph Data
export { SERVICES, INFRA, EDGES } from './knowledgeGraphMockData';
