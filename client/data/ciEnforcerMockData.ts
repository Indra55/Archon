export interface Violation {
    id: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    detail: string;
    actionLabel: string;
    actionType: 'doc-generator' | 'doc-generator-adr' | 'external' | 'none';
    actionRoute?: string;
}

export interface PRItem {
    id: number;
    number: number;
    title: string;
    author: string;
    authorInitials: string;
    team: string;
    branch: string;
    status: 'flagged' | 'passing' | 'pending';
    timeAgo: string;
    violations: Violation[];
    checksRun: number;
    checksPassed: number;
    linesChanged: number;
    filesChanged: number;
    linkedService: string | null;
}

export const PRS: PRItem[] = [
    {
        id: 1,
        number: 1847,
        title: "Add payment webhook handler and WebhookProcessor service",
        author: "@dev",
        authorInitials: "DV",
        team: "Payments",
        branch: "feat/payment-webhooks",
        status: "flagged",
        timeAgo: "2hr ago",
        violations: [
            {
                id: 1,
                severity: "critical",
                type: "Missing API documentation",
                detail: "New endpoint POST /v1/payments/webhook has no OpenAPI spec entry or API reference document. 3 other routes in this PR are also undocumented.",
                actionLabel: "Fix in Doc Generator",
                actionType: "doc-generator",
                actionRoute: "/dashboard/doc-generator?service=payment&template=api",
            },
            {
                id: 2,
                severity: "high",
                type: "Architecture drift detected",
                detail: "New service 'WebhookProcessor' introduced without an Architecture Decision Record. Team policy requires an ADR for any new service.",
                actionLabel: "Create ADR",
                actionType: "doc-generator-adr",
                actionRoute: "/dashboard/doc-generator?service=payment&template=adr",
            },
        ],
        checksRun: 7,
        checksPassed: 5,
        linesChanged: 412,
        filesChanged: 9,
        linkedService: "payment",
    },
    {
        id: 2,
        number: 1846,
        title: "Refactor auth middleware to support device-scoped sessions",
        author: "@sarah",
        authorInitials: "SK",
        team: "Platform",
        branch: "feat/device-sessions",
        status: "passing",
        timeAgo: "4hr ago",
        violations: [],
        checksRun: 7,
        checksPassed: 7,
        linesChanged: 187,
        filesChanged: 6,
        linkedService: "auth",
    },
    {
        id: 3,
        number: 1845,
        title: "Migrate Order Service pagination from offset to cursor-based",
        author: "@raj",
        authorInitials: "RK",
        team: "Commerce",
        branch: "perf/cursor-pagination",
        status: "flagged",
        timeAgo: "6hr ago",
        violations: [
            {
                id: 3,
                severity: "high",
                type: "Stale API documentation",
                detail: "The Order Service API Reference has not been updated to reflect the new cursor-based pagination parameters (cursor, hasMore, nextCursor). The old 'page' and 'offset' parameters are still documented.",
                actionLabel: "Fix in Doc Generator",
                actionType: "doc-generator",
                actionRoute: "/dashboard/doc-generator?service=order&template=api",
            },
            {
                id: 4,
                severity: "medium",
                type: "Missing ADR",
                detail: "Pagination strategy is an architecture-level decision. This migration from offset to cursor pagination should be captured in an ADR for future engineers.",
                actionLabel: "Create ADR",
                actionType: "doc-generator-adr",
                actionRoute: "/dashboard/doc-generator?service=order&template=adr",
            },
        ],
        checksRun: 7,
        checksPassed: 5,
        linesChanged: 298,
        filesChanged: 11,
        linkedService: "order",
    },
    {
        id: 4,
        number: 1844,
        title: "Fix auth token expiry bug — extend refresh window to 30 days",
        author: "@mike",
        authorInitials: "MP",
        team: "Platform",
        branch: "fix/token-expiry",
        status: "passing",
        timeAgo: "1d ago",
        violations: [],
        checksRun: 7,
        checksPassed: 7,
        linesChanged: 34,
        filesChanged: 2,
        linkedService: "auth",
    },
    {
        id: 5,
        number: 1843,
        title: "Add Kafka consumer for analytics event processing",
        author: "@ananya",
        authorInitials: "AP",
        team: "Data",
        branch: "feat/analytics-consumer",
        status: "pending",
        timeAgo: "1d ago",
        violations: [],
        checksRun: 3,
        checksPassed: 3,
        linesChanged: 156,
        filesChanged: 5,
        linkedService: "analytics",
    },
    {
        id: 6,
        number: 1842,
        title: "Add retry logic to Stripe gateway calls in Payment Service",
        author: "@dev",
        authorInitials: "DV",
        team: "Payments",
        branch: "fix/stripe-retry",
        status: "passing",
        timeAgo: "2d ago",
        violations: [],
        checksRun: 7,
        checksPassed: 7,
        linesChanged: 89,
        filesChanged: 3,
        linkedService: "payment",
    },
    {
        id: 7,
        number: 1841,
        title: "Notification Service — add push notification support",
        author: "@sarah",
        authorInitials: "SK",
        team: "Platform",
        branch: "feat/push-notifications",
        status: "flagged",
        timeAgo: "2d ago",
        violations: [
            {
                id: 5,
                severity: "critical",
                type: "Service completely undocumented",
                detail: "The Notification Service now has 4 endpoints with zero documentation. No API Reference, no ADR, and no runbook exist for this service.",
                actionLabel: "Fix in Doc Generator",
                actionType: "doc-generator",
                actionRoute: "/dashboard/doc-generator?service=notification&template=api",
            },
        ],
        checksRun: 7,
        checksPassed: 6,
        linesChanged: 534,
        filesChanged: 14,
        linkedService: "notification",
    },
    {
        id: 8,
        number: 1840,
        title: "Update billing scheduler to use new payment idempotency keys",
        author: "@raj",
        authorInitials: "RK",
        team: "Payments",
        branch: "feat/billing-idempotency",
        status: "passing",
        timeAgo: "3d ago",
        violations: [],
        checksRun: 7,
        checksPassed: 7,
        linesChanged: 112,
        filesChanged: 4,
        linkedService: "payment",
    },
];

export const SPARKLINE_DATA = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    passing: Math.floor(60 + Math.random() * 20 + i * 0.4),
    flagged: Math.floor(25 - Math.random() * 10 - i * 0.3),
}));

export const TEAMS = ['All Teams', 'Payments', 'Platform', 'Commerce', 'Data'];

export const POLICIES = [
    // Documentation group
    {
        id: 'no-docs-no-merge',
        label: 'No docs, no merge',
        description: 'Block PRs that introduce API endpoints with no OpenAPI spec or reference document.',
        enabled: true,
        group: 'documentation' as const,
    },
    {
        id: 'require-adr-new-services',
        label: 'Require ADR for new services',
        description: 'Flag any PR that adds a new service directory without a linked Architecture Decision Record.',
        enabled: true,
        group: 'documentation' as const,
    },
    {
        id: 'require-runbook-sla',
        label: 'Require runbook for SLA services',
        description: 'Block PRs touching services marked as SLA-critical if they have no runbook.',
        enabled: false,
        group: 'documentation' as const,
    },
    {
        id: 'flag-stale-docs',
        label: 'Flag PRs touching stale services',
        description: 'Warn when a PR modifies a service whose documentation is more than 14 days old.',
        enabled: true,
        group: 'documentation' as const,
    },
    // Architecture group
    {
        id: 'detect-arch-drift',
        label: 'Detect architecture drift',
        description: 'Compare each PR against the registered ADRs for affected services and flag divergences.',
        enabled: true,
        group: 'architecture' as const,
    },
    {
        id: 'flag-undocumented-endpoints',
        label: 'Flag services with >3 undocumented endpoints',
        description: 'Flag any service in the PR that has more than 3 endpoints with no API documentation.',
        enabled: false,
        group: 'architecture' as const,
    },
    {
        id: 'require-openapi',
        label: 'Require OpenAPI spec for all new routes',
        description: 'Block PRs that add new HTTP routes without a corresponding OpenAPI spec entry.',
        enabled: true,
        group: 'architecture' as const,
    },
    // Audit group
    {
        id: 'log-violations',
        label: 'Log all policy violations',
        description: 'Write a timestamped record of every violation to the audit ledger for compliance review.',
        enabled: true,
        group: 'audit' as const,
    },
    {
        id: 'notify-slack',
        label: 'Post violations to Slack',
        description: 'Send a Slack message to the author\'s team channel when their PR is flagged.',
        enabled: false,
        group: 'audit' as const,
    },
];

export const AUDIT_LOG_ENTRIES = [
    { id: 1, timestamp: "2025-06-10 14:32", pr: 1847, violation: "Missing API documentation", author: "@dev", team: "Payments", resolution: "pending" },
    { id: 2, timestamp: "2025-06-10 14:32", pr: 1847, violation: "Architecture drift detected", author: "@dev", team: "Payments", resolution: "pending" },
    { id: 3, timestamp: "2025-06-10 11:18", pr: 1845, violation: "Stale API documentation", author: "@raj", team: "Commerce", resolution: "pending" },
    { id: 4, timestamp: "2025-06-10 11:18", pr: 1845, violation: "Missing ADR", author: "@raj", team: "Commerce", resolution: "pending" },
    { id: 5, timestamp: "2025-06-09 17:05", pr: 1841, violation: "Service completely undocumented", author: "@sarah", team: "Platform", resolution: "pending" },
    { id: 6, timestamp: "2025-06-08 09:44", pr: 1839, violation: "Missing API documentation", author: "@dev", team: "Payments", resolution: "resolved" },
    { id: 7, timestamp: "2025-06-07 16:20", pr: 1836, violation: "Architecture drift detected", author: "@mike", team: "Platform", resolution: "resolved" },
];
