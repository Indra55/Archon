export type EngineerRole = 'backend' | 'frontend' | 'sre' | 'data';
export type TaskType = 'read' | 'explore' | 'task' | 'quiz';

export interface DeepLink {
    route: string;
    params: Record<string, string>;
    label: string;
    openInNewTab: boolean;
}

export interface OnboardingTask {
    id: string;
    moduleId: string;
    type: TaskType;
    title: string;
    description: string;
    estimatedMinutes: number;
    deepLink: DeepLink | null;
    completionCriteria: string;
    hint: string | null;
}

export interface OnboardingModule {
    id: string;
    title: string;
    serviceId: string | null;
    estimatedMinutes: number;
    description: string;
    tasks: OnboardingTask[];
}

export interface RoleDefinition {
    id: EngineerRole;
    label: string;
    icon: string;
    description: string;
    color: string;
    moduleIds: string[];
}

export interface PersonToKnow {
    name: string;
    role: string;
    team: string;
    avatarInitials: string;
    relevantRoles: EngineerRole[];
    slackHandle: string;
    expertise: string[];
}

export interface KeyChannel {
    name: string;
    purpose: string;
    relevantRoles: EngineerRole[];
}

export interface KeyADR {
    id: string;
    title: string;
    relevantRoles: EngineerRole[];
    deepLink: string;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export const MODULES: OnboardingModule[] = [
    {
        id: 'system-overview',
        title: 'System Overview',
        serviceId: null,
        estimatedMinutes: 25,
        description: 'Understand the big picture before diving into any service. Learn how traffic flows, which teams own what, and the core architectural decisions that shape everything.',
        tasks: [
            {
                id: 'task-sys-1',
                moduleId: 'system-overview',
                type: 'read',
                title: 'Read the Architecture Overview',
                description: 'Read the top-level architecture doc covering our microservices topology, team ownership model, and tech stack choices.',
                estimatedMinutes: 10,
                deepLink: { route: '/dashboard/ask', params: { q: 'Give me a high level overview of our system architecture' }, label: 'Ask the Brain', openInNewTab: false },
                completionCriteria: 'You can name all six services, their owning teams, and the primary communication patterns between them.',
                hint: 'Focus on the ownership column in the knowledge graph — each service maps to exactly one team.',
            },
            {
                id: 'task-sys-2',
                moduleId: 'system-overview',
                type: 'explore',
                title: 'Explore the Knowledge Graph',
                description: 'Open the Knowledge Graph and spend 10 minutes exploring the full system map. Zoom into any service, read its description, and trace at least two dependency chains.',
                estimatedMinutes: 10,
                deepLink: { route: '/dashboard/knowledge-graph', params: { mode: 'graph' }, label: 'Open Knowledge Graph', openInNewTab: false },
                completionCriteria: 'You have found and read the detail drawer for at least two services.',
                hint: 'Click any node to open its detail drawer. Look for the dependency graph at the bottom of each drawer.',
            },
            {
                id: 'task-sys-3',
                moduleId: 'system-overview',
                type: 'quiz',
                title: 'System Overview Check',
                description: 'Answer three quick questions to confirm you have the lay of the land.',
                estimatedMinutes: 5,
                deepLink: null,
                completionCriteria: 'You answered all three questions.',
                hint: null,
            },
        ],
    },
    {
        id: 'auth',
        title: 'Auth Service',
        serviceId: 'auth',
        estimatedMinutes: 35,
        description: 'Authentication is the front door to everything. Learn how tokens are issued, refreshed, and validated — and why the 15-minute window matters.',
        tasks: [
            {
                id: 'task-auth-1',
                moduleId: 'auth',
                type: 'read',
                title: 'Read Auth Service documentation',
                description: 'Read the Auth Service API reference and the ADR explaining the JWT sliding-window design.',
                estimatedMinutes: 15,
                deepLink: { route: '/dashboard/knowledge-graph', params: { highlight: 'auth', mode: 'graph' }, label: 'View Auth in Graph', openInNewTab: false },
                completionCriteria: 'You understand the difference between access tokens and refresh tokens, and why we use 15-minute expiry.',
                hint: 'Check the health drawer for Auth Service — it lists the ADRs directly.',
            },
            {
                id: 'task-auth-2',
                moduleId: 'auth',
                type: 'explore',
                title: 'Trace an auth request end-to-end',
                description: 'Starting from the API Gateway, trace a login request through the Auth Service all the way to the Auth DB and Redis cache.',
                estimatedMinutes: 10,
                deepLink: { route: '/dashboard/ask', params: { q: 'How does a login request flow from the API gateway through the auth service?' }, label: 'Ask the Brain', openInNewTab: false },
                completionCriteria: 'You can describe each hop in the request chain, including which data store is read at each step.',
                hint: 'In the Knowledge Graph, click the auth node then look at the Connections section of the detail drawer.',
            },
            {
                id: 'task-auth-3',
                moduleId: 'auth',
                type: 'task',
                title: 'Write a token refresh test',
                description: 'In the auth-service repository, add a unit test that verifies a valid refresh token produces a new access token with the correct expiry.',
                estimatedMinutes: 30,
                deepLink: { route: '/dashboard/ask', params: { q: 'Show me how refresh token tests are structured in auth-service' }, label: 'Ask the Brain for context', openInNewTab: false },
                completionCriteria: 'Your test passes locally and is ready for PR review.',
                hint: 'Look at the existing tests in /src/__tests__/token.test.ts for the pattern.',
            },
        ],
    },
    {
        id: 'payment',
        title: 'Payment Service',
        serviceId: 'payment',
        estimatedMinutes: 40,
        description: 'The most critical service in the system — and currently the most under-documented. Understand how money moves, what Stripe handles vs. what we handle, and where the failure modes live.',
        tasks: [
            {
                id: 'task-pay-1',
                moduleId: 'payment',
                type: 'read',
                title: 'Read the Payment Service overview',
                description: 'Read what documentation exists for the Payment Service, then check the Health Dashboard to see what is missing. Notice the documentation debt firsthand.',
                estimatedMinutes: 10,
                deepLink: { route: '/dashboard/knowledge-graph', params: { highlight: 'payment', mode: 'health' }, label: 'View in Health Dashboard', openInNewTab: false },
                completionCriteria: 'You can identify the two missing ADRs and explain why their absence is a risk.',
                hint: 'Look at the "Missing Artifacts" section in the Payment Service knowledge graph drawer.',
            },
            {
                id: 'task-pay-2',
                moduleId: 'payment',
                type: 'explore',
                title: 'Run a What-If analysis on Payment',
                description: 'Open the What-If analyzer and ask: "What happens if the Payment Service goes down?" Read the full impact report and identify all affected services.',
                estimatedMinutes: 10,
                deepLink: { route: '/dashboard/what-if', params: { scenario: 'What happens if the Payment Service goes down?' }, label: 'Open What-If Analyzer', openInNewTab: false },
                completionCriteria: 'You can list every service that would be affected and explain the blast radius.',
                hint: 'Pay attention to the dependency graph on the right side of the report — every highlighted node is a casualty.',
            },
            {
                id: 'task-pay-3',
                moduleId: 'payment',
                type: 'task',
                title: 'Draft the missing Runbook',
                description: 'Use the AI Doc Generator to draft the missing Runbook for the Payment Service. Review and edit the generated output — do not just accept it verbatim.',
                estimatedMinutes: 20,
                deepLink: { route: '/dashboard/doc-generator', params: { service: 'payment', template: 'runbook' }, label: 'Open Doc Generator', openInNewTab: false },
                completionCriteria: 'A Runbook draft exists for Payment Service with at least the on-call escalation path filled in.',
                hint: null,
            },
        ],
    },
    {
        id: 'order',
        title: 'Order Service',
        serviceId: 'order',
        estimatedMinutes: 30,
        description: 'Orders are the core business transaction. Learn the full order lifecycle — from cart creation to fulfillment — and the architectural decision that moved us to cursor-based pagination.',
        tasks: [
            {
                id: 'task-ord-1',
                moduleId: 'order',
                type: 'read',
                title: 'Understand the order lifecycle',
                description: 'Read the Order Service docs covering the state machine for an order: PENDING → CONFIRMED → SHIPPED → DELIVERED → (optionally) REFUNDED.',
                estimatedMinutes: 10,
                deepLink: { route: '/dashboard/ask', params: { q: 'What are all the possible states of an order and what triggers each transition?' }, label: 'Ask the Brain', openInNewTab: false },
                completionCriteria: 'You can draw the order state machine from memory.',
                hint: null,
            },
            {
                id: 'task-ord-2',
                moduleId: 'order',
                type: 'explore',
                title: 'Find why we switched to cursor pagination',
                description: 'Locate ADR-002, which documents the decision to switch from offset to cursor-based pagination in the v2 migration. Understand the performance problem it solved.',
                estimatedMinutes: 10,
                deepLink: { route: '/dashboard/knowledge-graph', params: { highlight: 'order', mode: 'graph' }, label: 'View Order Service', openInNewTab: false },
                completionCriteria: 'You understand the performance problem with offset pagination at our scale and can articulate the tradeoffs.',
                hint: 'ADR-002 is linked from the Order Service drawer in the Knowledge Graph.',
            },
            {
                id: 'task-ord-3',
                moduleId: 'order',
                type: 'task',
                title: 'Add a test for the REFUNDED state transition',
                description: 'In the order-service repo, write a test verifying that a DELIVERED order can transition to REFUNDED but a PENDING order cannot.',
                estimatedMinutes: 20,
                deepLink: { route: '/dashboard/ask', params: { q: 'Show me examples of state transition tests in the order service' }, label: 'Find examples in codebase', openInNewTab: false },
                completionCriteria: 'Both the happy path and the guard condition are tested and passing.',
                hint: 'Check /src/order/stateMachine.test.ts for existing patterns.',
            },
        ],
    },
    {
        id: 'notification',
        title: 'Notification Service',
        serviceId: 'notification',
        estimatedMinutes: 20,
        description: 'The least-documented service in the system — and the newest. Learn how it consumes events from Kafka and dispatches email and push notifications.',
        tasks: [
            {
                id: 'task-not-1',
                moduleId: 'notification',
                type: 'read',
                title: 'Read what documentation exists',
                description: 'The Notification Service has a documentation coverage of only 21%. Read what exists, and use Ask the Brain to fill in the gaps.',
                estimatedMinutes: 10,
                deepLink: { route: '/dashboard/ask', params: { q: 'How does the notification service consume and process Kafka events?' }, label: 'Ask the Brain', openInNewTab: false },
                completionCriteria: 'You can explain how a payment event triggers an email notification end-to-end.',
                hint: 'This is a good exercise in navigating underdocumented services — a real-world skill.',
            },
            {
                id: 'task-not-2',
                moduleId: 'notification',
                type: 'task',
                title: 'Create the missing API Reference',
                description: 'Use the AI Doc Generator to create the API Reference for the Notification Service. The 4 endpoints are undocumented — find them in the codebase first.',
                estimatedMinutes: 20,
                deepLink: { route: '/dashboard/doc-generator', params: { service: 'notification', template: 'api' }, label: 'Open Doc Generator', openInNewTab: false },
                completionCriteria: 'All 4 endpoints are documented with request/response shapes and at least one example each.',
                hint: 'Ask the Brain: "What are the 4 API endpoints exposed by the notification service?"',
            },
        ],
    },
    {
        id: 'ci-workflow',
        title: 'CI/CD & Standards',
        serviceId: null,
        estimatedMinutes: 20,
        description: 'Learn how Archon integrates into our development workflow — what it checks on every PR, how to interpret CI failures, and how to fix a blocked merge.',
        tasks: [
            {
                id: 'task-ci-1',
                moduleId: 'ci-workflow',
                type: 'read',
                title: 'Read the CI enforcement rules',
                description: 'Review the active CI/CD enforcement rules in Archon. Understand what triggers a block vs. a warning, and how to resolve each.',
                estimatedMinutes: 10,
                deepLink: { route: '/dashboard/ci-enforcer', params: {}, label: 'Open CI Enforcer', openInNewTab: false },
                completionCriteria: 'You know what "No docs, no merge" means in practice and what to do when your PR is blocked by it.',
                hint: null,
            },
            {
                id: 'task-ci-2',
                moduleId: 'ci-workflow',
                type: 'task',
                title: 'Resolve a simulated CI block',
                description: 'We have created a sandboxed demo PR that is blocked by two CI violations. Use the CI Enforcer to diagnose the issues and walk through how you would fix them.',
                estimatedMinutes: 10,
                deepLink: { route: '/dashboard/ci-enforcer', params: { demo: 'true' }, label: 'Open Demo PR', openInNewTab: false },
                completionCriteria: 'You have identified both violations and described the steps to unblock the PR.',
                hint: 'One violation is a missing API doc. The other is an architecture drift — a new dependency that was not reflected in the knowledge graph.',
            },
        ],
    },
];

export const ROLES: RoleDefinition[] = [
    {
        id: 'backend',
        label: 'Backend Engineer',
        icon: '⚙️',
        description: 'Owns microservices, APIs, and data models.',
        color: 'text-[#6366F1]', // text-accent mapping
        moduleIds: ['system-overview', 'auth', 'payment', 'order', 'notification', 'ci-workflow'],
    },
    {
        id: 'frontend',
        label: 'Frontend Developer',
        icon: '🖥️',
        description: 'Consumes APIs and builds user-facing products.',
        color: 'text-green-500',
        moduleIds: ['system-overview', 'auth', 'payment', 'ci-workflow'],
    },
    {
        id: 'sre',
        label: 'Site Reliability Engineer',
        icon: '🛡️',
        description: 'Owns availability, incidents, and observability.',
        color: 'text-amber-500',
        moduleIds: ['system-overview', 'payment', 'notification', 'ci-workflow'],
    },
    {
        id: 'data',
        label: 'Data Engineer',
        icon: '📊',
        description: 'Owns analytics pipelines and event streams.',
        color: 'text-cyan-500',
        moduleIds: ['system-overview', 'payment', 'notification'],
    },
];

export const PEOPLE: PersonToKnow[] = [
    {
        name: 'Prashant Mehta',
        role: 'Staff Engineer',
        team: 'Platform',
        avatarInitials: 'PM',
        relevantRoles: ['backend', 'sre'],
        slackHandle: '@prashant',
        expertise: ['Auth Service', 'API Gateway', 'System Architecture'],
    },
    {
        name: 'Meera Iyer',
        role: 'Principal Architect',
        team: 'Architecture',
        avatarInitials: 'MI',
        relevantRoles: ['backend', 'frontend', 'sre', 'data'],
        slackHandle: '@meera',
        expertise: ['ADRs', 'System Design', 'Cross-team Decisions'],
    },
    {
        name: 'Jordan Blake',
        role: 'Senior Engineer',
        team: 'Payments',
        avatarInitials: 'JB',
        relevantRoles: ['backend', 'frontend'],
        slackHandle: '@jordan',
        expertise: ['Payment Service', 'Stripe Integration', 'Kafka'],
    },
    {
        name: 'Sana Kureshi',
        role: 'SRE Lead',
        team: 'Platform',
        avatarInitials: 'SK',
        relevantRoles: ['sre', 'backend'],
        slackHandle: '@sana',
        expertise: ['Incidents', 'On-call', 'Runbooks'],
    },
    {
        name: 'Rahul Das',
        role: 'Senior Data Engineer',
        team: 'Data',
        avatarInitials: 'RD',
        relevantRoles: ['data'],
        slackHandle: '@rahul',
        expertise: ['Analytics Service', 'Kafka consumers', 'Data pipelines'],
    },
];

export const CHANNELS: KeyChannel[] = [
    { name: '#engineering-general', purpose: 'Org-wide engineering discussion', relevantRoles: ['backend', 'frontend', 'sre', 'data'] },
    { name: '#payment-eng', purpose: 'Payment team discussions', relevantRoles: ['backend', 'frontend'] },
    { name: '#incidents', purpose: 'Real-time incident coordination', relevantRoles: ['sre', 'backend'] },
    { name: '#data-infra', purpose: 'Kafka, pipelines, analytics', relevantRoles: ['data', 'backend'] },
    { name: '#api-consumers', purpose: 'API change announcements & breaking changes', relevantRoles: ['frontend', 'backend'] },
    { name: '#architecture', purpose: 'ADR proposals, design reviews', relevantRoles: ['backend', 'sre', 'data'] },
];

export const KEY_ADRS: KeyADR[] = [
    { id: 'ADR-001', title: 'Microservices over monolith', relevantRoles: ['backend', 'frontend', 'sre', 'data'], deepLink: '/dashboard/ask?q=Explain+ADR-001' },
    { id: 'ADR-002', title: 'Cursor-based pagination in Order v2', relevantRoles: ['backend', 'frontend'], deepLink: '/dashboard/ask?q=Explain+ADR-002' },
    { id: 'ADR-004', title: 'Kafka as the async event backbone', relevantRoles: ['backend', 'sre', 'data'], deepLink: '/dashboard/ask?q=Explain+ADR-004' },
    { id: 'ADR-005', title: 'JWT sliding-window auth strategy', relevantRoles: ['backend', 'frontend'], deepLink: '/dashboard/ask?q=Explain+ADR-005' },
    { id: 'ADR-007', title: 'PostgreSQL for transactional services', relevantRoles: ['backend', 'data'], deepLink: '/dashboard/ask?q=Explain+ADR-007' },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
    {
        id: 'q1',
        question: 'Which team owns the Notification Service?',
        options: ['Commerce', 'Payments', 'Platform', 'Data'],
        correctIndex: 2,
        explanation: 'The Platform team owns Notification, Auth, and the API Gateway.',
    },
    {
        id: 'q2',
        question: 'Which protocol does the Order Service use to call the Payment Service?',
        options: ['REST', 'gRPC', 'Kafka Event', 'GraphQL'],
        correctIndex: 1,
        explanation: 'Order → Payment is a synchronous gRPC call. The async event path goes via Kafka.',
    },
    {
        id: 'q3',
        question: 'What is the documentation coverage of the Notification Service?',
        options: ['74%', '55%', '92%', '21%'],
        correctIndex: 3,
        explanation: 'Notification Service has only 21% doc coverage — the lowest in the system. This is an open task.',
    },
];
