export const REPO_STATS = {
    repoName: "my-org/backend",
    branch: "main",
    totalCommits: 2847,
    totalBranches: 23,
    activeBranches: 8,
    openPRs: 11,
    mergedPRsThisWeek: 14,
    totalPushesToday: 9,
    totalPushesThisWeek: 47,
    lastPushAt: "14 minutes ago",
    contributors: 12,
    codeChurnRate: 18,
}

export const QUALITY_METRICS = {
    docCoverage: 73,
    apiCoverage: 88,
    adrCoverage: 61,
    criticalGaps: 11,
    testCoverage: 84,
    codeHealthScore: 74,
    openViolations: 11,
    resolvedThisWeek: 7,
    architectureDriftCount: 3,
}

export const SERVICES_SUMMARY = {
    total: 6,
    healthy: 3,
    stale: 2,
    undocumented: 1,
    servicesWithOpenIncidents: 1,
}

export const KNOWLEDGE_METRICS = {
    totalQAPairs: 142,
    pinnedAnswers: 31,
    questionsThisWeek: 18,
    topUnanswered: 4,
    knowledgeGrowthRate: 12,
}

export const COMMIT_HISTORY = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    commits: Math.floor(Math.random() * 18) + 3,
    pushes: Math.floor(Math.random() * 12) + 1,
}))

export const RECENT_ACTIVITY = [
    { id: 1, type: "pr_blocked", text: "PR #1847 blocked — missing API docs", time: "14m ago", severity: "red", route: "/dashboard/ci-enforcer" },
    { id: 2, type: "docs_stale", text: "Payment Service docs not updated in 14 days", time: "2hr ago", severity: "amber", route: "/dashboard/doc-generator" },
    { id: 3, type: "pr_merged", text: "PR #1846 merged — Auth middleware refactor", time: "4hr ago", severity: "green", route: "/dashboard/ci-enforcer" },
    { id: 4, type: "suggestion", text: "Self-Healer found retry policy gap in Payment", time: "5hr ago", severity: "amber", route: "/dashboard/self-healer" },
    { id: 5, type: "qa_pinned", text: "\"JWT validation flow\" pinned to Knowledge Base", time: "1d ago", severity: "accent", route: "/dashboard/qa" },
    { id: 6, type: "pr_merged", text: "PR #1845 merged — Order Service pagination", time: "1d ago", severity: "green", route: "/dashboard/ci-enforcer" },
    { id: 7, type: "gap_detected", text: "Notification Service: 3 endpoints undocumented", time: "2d ago", severity: "red", route: "/dashboard/knowledge-graph" },
    { id: 8, type: "adr_created", text: "ADR-004 created: Event-driven payments pattern", time: "2d ago", severity: "accent", route: "/dashboard/doc-generator" },
]

export const TOP_ALERTS = [
    { id: 1, title: "PR #1847 blocked from merge", detail: "2 documentation violations found", severity: "critical", route: "/dashboard/ci-enforcer" },
    { id: 2, title: "Notification Service completely undocumented", detail: "4 endpoints with no API reference", severity: "critical", route: "/dashboard/knowledge-graph" },
    { id: 3, title: "3 services experiencing architecture drift", detail: "Diverged from their registered ADRs", severity: "high", route: "/dashboard/knowledge-graph" },
    { id: 4, title: "Payment Service docs are 14 days stale", detail: "API Reference needs to be regenerated", severity: "high", route: "/dashboard/doc-generator" },
    { id: 5, title: "4 Self-Healer patches awaiting approval", detail: "Retry logic, caching, and missing ADRs", severity: "medium", route: "/dashboard/self-healer" },
]

export const FEATURES = [
    {
        id: "architecture-agent",
        name: "Architecture Agent",
        description: "Describe a system in plain English. Get architecture diagrams, tech stack recommendations, and scaffolded infrastructure.",
        icon: "BrainCircuit",
        route: "/dashboard/architecture-agent",
        status: "coming_soon",
        category: "Core",
    },
    {
        id: "codebase-qa",
        name: "Codebase Intelligence",
        description: "Ask any question about the codebase. Get answers with exact file references, line numbers, and diagrams.",
        icon: "SearchCode",
        route: "/dashboard/codebase-qa",
        status: "coming_soon",
        category: "Core",
    },
    {
        id: "knowledge-graph",
        name: "Knowledge Graph",
        description: "A live, interactive map of all services, APIs, schemas, and dependencies with a real-time health dashboard.",
        icon: "Network",
        route: "/dashboard/knowledge-graph",
        status: "coming_soon",
        category: "Core",
    },
    {
        id: "what-if",
        name: "What-If Analyzer",
        description: "Describe a proposed change. See exactly which services break, which clients are affected, and how to migrate safely.",
        icon: "Zap",
        route: "/dashboard/what-if",
        status: "coming_soon",
        category: "Core",
    },
    {
        id: "doc-generator",
        name: "Doc Generator",
        description: "AI-detected code changes are turned into documentation diffs. Review, accept, and ship always-current docs.",
        icon: "FileEdit",
        route: "/dashboard/doc-generator",
        status: "coming_soon",
        category: "Tools",
    },
    {
        id: "ci-enforcer",
        name: "CI Enforcer",
        description: "Every PR is checked for missing docs, undocumented APIs, and architecture drift. No docs, no merge.",
        icon: "ShieldCheck",
        route: "/dashboard/ci-enforcer",
        status: "coming_soon",
        category: "Tools",
    },
    {
        id: "onboarding",
        name: "Onboarding Paths",
        description: "Personalized learning paths for new team members based on their role, team, and the actual codebase.",
        icon: "Compass",
        route: "/dashboard/onboarding",
        status: "coming_soon",
        category: "Tools",
    },
    {
        id: "timeline",
        name: "Architecture Timeline",
        description: "Scrub through your entire architecture history. See how the system evolved, replay incidents, compare states.",
        icon: "GitBranch",
        route: "/dashboard/timeline",
        status: "coming_soon",
        category: "Explore",
    },
    {
        id: "self-healer",
        name: "Self-Healer",
        description: "AI detects fragile patterns, missing retry logic, and undocumented code. Auto-generates and submits fix PRs.",
        icon: "Bandage",
        route: "/dashboard/self-healer",
        status: "coming_soon",
        category: "Explore",
    },
]
