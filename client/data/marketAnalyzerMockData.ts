// ──────────────────────────────────────────────────────────────
// Market Analyzer · Mock Data
// ──────────────────────────────────────────────────────────────

export type ServiceCategory =
    | 'database'
    | 'cloud-platform'
    | 'ci-cd'
    | 'monitoring'
    | 'messaging'
    | 'authentication'
    | 'search'
    | 'cdn'
    | 'storage'
    | 'container-orchestration'
    | 'logging'
    | 'caching'

export interface DetectedService {
    id: string
    name: string
    category: ServiceCategory
    currentMonthlyCost: number
    usageContext: string
    detectedIn: string[]
    version?: string
    tier?: string
    confidence: number
}

export interface Alternative {
    id: string
    name: string
    estimatedMonthlyCost: number
    savingsPercent: number
    migrationComplexity: 'low' | 'medium' | 'high'
    featureParity: number
    pros: string[]
    cons: string[]
    freeTrialAvailable: boolean
    openSource: boolean
}

export interface ServiceSuggestion {
    service: DetectedService
    alternatives: Alternative[]
    aiRationale: string
}

// ── CATEGORY LABELS ──────────────────────────────────────────
export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
    'database': 'Database',
    'cloud-platform': 'Cloud Platform',
    'ci-cd': 'CI / CD',
    'monitoring': 'Monitoring',
    'messaging': 'Messaging',
    'authentication': 'Authentication',
    'search': 'Search',
    'cdn': 'CDN',
    'storage': 'Object Storage',
    'container-orchestration': 'Containers',
    'logging': 'Logging',
    'caching': 'Caching',
}

// ── DETECTED SERVICES ────────────────────────────────────────
export const DETECTED_SERVICES: DetectedService[] = [
    {
        id: 'svc-postgres',
        name: 'Amazon RDS (PostgreSQL)',
        category: 'database',
        currentMonthlyCost: 1420,
        usageContext: 'Primary relational store — orders, users, products',
        detectedIn: ['src/config/database.ts', 'docker-compose.yml', 'infra/rds.tf'],
        version: '15.4',
        tier: 'db.r6g.xlarge',
        confidence: 98,
    },
    {
        id: 'svc-redis',
        name: 'Amazon ElastiCache (Redis)',
        category: 'caching',
        currentMonthlyCost: 340,
        usageContext: 'Session store and API response cache',
        detectedIn: ['src/config/redis.ts', 'infra/elasticache.tf'],
        version: '7.0',
        tier: 'cache.r6g.large',
        confidence: 96,
    },
    {
        id: 'svc-aws',
        name: 'AWS (EC2 + ECS)',
        category: 'cloud-platform',
        currentMonthlyCost: 3200,
        usageContext: 'Primary compute — 12 microservices deployed',
        detectedIn: ['infra/ecs.tf', 'infra/ec2.tf', '.github/workflows/deploy.yml'],
        tier: 'Mixed (t3.medium + c6g.xlarge)',
        confidence: 99,
    },
    {
        id: 'svc-datadog',
        name: 'Datadog',
        category: 'monitoring',
        currentMonthlyCost: 890,
        usageContext: 'APM, infrastructure monitoring, log indexing',
        detectedIn: ['src/config/datadog.ts', 'package.json', 'infra/datadog.tf'],
        tier: 'Pro',
        confidence: 95,
    },
    {
        id: 'svc-github-actions',
        name: 'GitHub Actions',
        category: 'ci-cd',
        currentMonthlyCost: 210,
        usageContext: 'CI pipelines, deployment automation',
        detectedIn: ['.github/workflows/ci.yml', '.github/workflows/deploy.yml'],
        tier: 'Team',
        confidence: 99,
    },
    {
        id: 'svc-kafka',
        name: 'Confluent Kafka',
        category: 'messaging',
        currentMonthlyCost: 680,
        usageContext: 'Event streaming — order events, notifications, analytics',
        detectedIn: ['src/config/kafka.ts', 'infra/confluent.tf'],
        tier: 'Standard',
        confidence: 94,
    },
    {
        id: 'svc-auth0',
        name: 'Auth0',
        category: 'authentication',
        currentMonthlyCost: 450,
        usageContext: 'User authentication, SSO, MFA',
        detectedIn: ['src/middleware/auth.ts', 'src/config/auth0.ts'],
        tier: 'Professional',
        confidence: 97,
    },
    {
        id: 'svc-elasticsearch',
        name: 'Elastic Cloud',
        category: 'search',
        currentMonthlyCost: 560,
        usageContext: 'Full-text product search, autocomplete',
        detectedIn: ['src/services/search.service.ts', 'infra/elastic.tf'],
        version: '8.11',
        tier: 'Standard',
        confidence: 93,
    },
    {
        id: 'svc-cloudfront',
        name: 'AWS CloudFront',
        category: 'cdn',
        currentMonthlyCost: 180,
        usageContext: 'Static assets, API edge caching',
        detectedIn: ['infra/cloudfront.tf', 'next.config.js'],
        confidence: 97,
    },
    {
        id: 'svc-s3',
        name: 'AWS S3',
        category: 'storage',
        currentMonthlyCost: 120,
        usageContext: 'User uploads, backups, static assets',
        detectedIn: ['src/services/upload.service.ts', 'infra/s3.tf'],
        tier: 'Standard',
        confidence: 99,
    },
    {
        id: 'svc-k8s',
        name: 'Amazon EKS',
        category: 'container-orchestration',
        currentMonthlyCost: 740,
        usageContext: 'Kubernetes cluster for staging & production',
        detectedIn: ['k8s/', 'infra/eks.tf', 'Dockerfile'],
        version: '1.28',
        confidence: 96,
    },
    {
        id: 'svc-splunk',
        name: 'Splunk Cloud',
        category: 'logging',
        currentMonthlyCost: 620,
        usageContext: 'Centralized log aggregation, compliance auditing',
        detectedIn: ['src/config/logger.ts', 'infra/splunk.tf'],
        tier: 'Standard',
        confidence: 91,
    },
]

// ── SUGGESTIONS MAP ──────────────────────────────────────────
export const SUGGESTIONS_MAP: Record<string, ServiceSuggestion> = {
    'svc-postgres': {
        service: DETECTED_SERVICES.find(s => s.id === 'svc-postgres')!,
        alternatives: [
            {
                id: 'alt-pg-supabase',
                name: 'Supabase (Postgres)',
                estimatedMonthlyCost: 75,
                savingsPercent: 95,
                migrationComplexity: 'low',
                featureParity: 92,
                pros: ['Built-in auth & realtime', 'Generous free tier', 'Managed Postgres', 'Open-source'],
                cons: ['Smaller enterprise support', 'Fewer region options'],
                freeTrialAvailable: true,
                openSource: true,
            },
            {
                id: 'alt-pg-neon',
                name: 'Neon Serverless Postgres',
                estimatedMonthlyCost: 190,
                savingsPercent: 87,
                migrationComplexity: 'low',
                featureParity: 88,
                pros: ['Serverless auto-scaling', 'Branching for dev/staging', 'Pay-per-use model'],
                cons: ['Newer platform', 'Connection pooling limits'],
                freeTrialAvailable: true,
                openSource: true,
            },
            {
                id: 'alt-pg-planetscale',
                name: 'PlanetScale (MySQL-compatible)',
                estimatedMonthlyCost: 290,
                savingsPercent: 80,
                migrationComplexity: 'high',
                featureParity: 78,
                pros: ['Unlimited connections', 'Schema branching', 'Global replication'],
                cons: ['Requires migration from Postgres to MySQL', 'No foreign keys by default'],
                freeTrialAvailable: true,
                openSource: false,
            },
        ],
        aiRationale: 'Your current RDS instance is over-provisioned for the observed query patterns. Average CPU utilization is 12% and storage IOPS rarely exceed 1,000. A serverless Postgres option like Neon or Supabase can auto-scale to match actual demand, reducing costs by 80-95% while maintaining PostgreSQL compatibility.',
    },
    'svc-redis': {
        service: DETECTED_SERVICES.find(s => s.id === 'svc-redis')!,
        alternatives: [
            {
                id: 'alt-redis-upstash',
                name: 'Upstash Redis',
                estimatedMonthlyCost: 40,
                savingsPercent: 88,
                migrationComplexity: 'low',
                featureParity: 85,
                pros: ['Serverless per-request pricing', 'Global replication', 'REST API'],
                cons: ['Latency slightly higher', 'No Lua scripting on free tier'],
                freeTrialAvailable: true,
                openSource: false,
            },
            {
                id: 'alt-redis-dragonflydb',
                name: 'Dragonfly DB',
                estimatedMonthlyCost: 95,
                savingsPercent: 72,
                migrationComplexity: 'medium',
                featureParity: 94,
                pros: ['Drop-in Redis replacement', '25x memory efficiency', 'Multi-threaded'],
                cons: ['Self-hosted required', 'Smaller community'],
                freeTrialAvailable: false,
                openSource: true,
            },
        ],
        aiRationale: 'ElastiCache is running a reserved r6g.large but session data volume peaks at only 2 GB. A serverless option like Upstash aligns cost with actual usage, and Dragonfly can run on a much smaller instance due to superior memory efficiency.',
    },
    'svc-aws': {
        service: DETECTED_SERVICES.find(s => s.id === 'svc-aws')!,
        alternatives: [
            {
                id: 'alt-aws-railway',
                name: 'Railway',
                estimatedMonthlyCost: 450,
                savingsPercent: 86,
                migrationComplexity: 'medium',
                featureParity: 72,
                pros: ['Zero-config deploys', 'Usage-based billing', 'Built-in databases'],
                cons: ['Less granular control', 'Limited regions'],
                freeTrialAvailable: true,
                openSource: false,
            },
            {
                id: 'alt-aws-flyio',
                name: 'Fly.io',
                estimatedMonthlyCost: 620,
                savingsPercent: 81,
                migrationComplexity: 'medium',
                featureParity: 80,
                pros: ['Edge deployment', 'Built-in Wireguard networking', 'Fast cold starts'],
                cons: ['Smaller ecosystem', 'Debugging can be harder'],
                freeTrialAvailable: true,
                openSource: false,
            },
            {
                id: 'alt-aws-hetzner',
                name: 'Hetzner Cloud',
                estimatedMonthlyCost: 380,
                savingsPercent: 88,
                migrationComplexity: 'high',
                featureParity: 68,
                pros: ['Extremely low cost per vCPU', 'European data centers', 'Excellent networking'],
                cons: ['No managed services', 'EU-only regions', 'Self-managed infrastructure'],
                freeTrialAvailable: false,
                openSource: false,
            },
        ],
        aiRationale: 'Your EC2 fleet runs 12 microservices but 6 are low-traffic internal tools averaging < 5 req/min. Moving those to Railway or Fly.io with per-second billing could save $2,400+/month. High-traffic services could shift to Hetzner for raw compute savings.',
    },
    'svc-datadog': {
        service: DETECTED_SERVICES.find(s => s.id === 'svc-datadog')!,
        alternatives: [
            {
                id: 'alt-dd-grafana',
                name: 'Grafana Cloud (LGTM Stack)',
                estimatedMonthlyCost: 220,
                savingsPercent: 75,
                migrationComplexity: 'medium',
                featureParity: 88,
                pros: ['Open-source ecosystem', 'Generous free tier', 'Unified metrics/logs/traces'],
                cons: ['More setup complexity', 'Steeper learning curve'],
                freeTrialAvailable: true,
                openSource: true,
            },
            {
                id: 'alt-dd-newrelic',
                name: 'New Relic',
                estimatedMonthlyCost: 350,
                savingsPercent: 61,
                migrationComplexity: 'low',
                featureParity: 95,
                pros: ['100 GB free ingest/month', 'Full-stack observability', 'Easy migration from Datadog'],
                cons: ['Costs rise with data volume', 'User-based pricing can spike'],
                freeTrialAvailable: true,
                openSource: false,
            },
        ],
        aiRationale: 'Datadog Pro tier with APM + log indexing is your 4th highest cost. Grafana Cloud offers comparable dashboards with open-source flexibility. New Relic\'s 100 GB/month free ingest covers most startup-stage workloads.',
    },
    'svc-github-actions': {
        service: DETECTED_SERVICES.find(s => s.id === 'svc-github-actions')!,
        alternatives: [
            {
                id: 'alt-ci-dagger',
                name: 'Dagger + Self-Hosted Runners',
                estimatedMonthlyCost: 40,
                savingsPercent: 81,
                migrationComplexity: 'high',
                featureParity: 82,
                pros: ['Portable CI pipelines', 'Local debugging', 'Container-native'],
                cons: ['Requires self-hosted runner infrastructure', 'Newer ecosystem'],
                freeTrialAvailable: true,
                openSource: true,
            },
            {
                id: 'alt-ci-gitlab',
                name: 'GitLab CI (Free Tier)',
                estimatedMonthlyCost: 0,
                savingsPercent: 100,
                migrationComplexity: 'medium',
                featureParity: 90,
                pros: ['400 CI/CD minutes free', 'Built-in container registry', 'Auto DevOps'],
                cons: ['Requires repo mirror or migration', 'Different YAML syntax'],
                freeTrialAvailable: true,
                openSource: true,
            },
        ],
        aiRationale: 'Your CI workflows consume ~2,100 minutes/month. GitLab CI provides 400 free minutes with additional minutes at lower cost. Dagger allows pipeline portability if you invest in self-hosted runners on a $20/month VPS.',
    },
    'svc-kafka': {
        service: DETECTED_SERVICES.find(s => s.id === 'svc-kafka')!,
        alternatives: [
            {
                id: 'alt-kafka-redpanda',
                name: 'Redpanda',
                estimatedMonthlyCost: 280,
                savingsPercent: 59,
                migrationComplexity: 'low',
                featureParity: 96,
                pros: ['Kafka API-compatible', 'No JVM — lower latency', '10x faster'],
                cons: ['Smaller community', 'Fewer connectors'],
                freeTrialAvailable: true,
                openSource: true,
            },
            {
                id: 'alt-kafka-upstash-kafka',
                name: 'Upstash Kafka',
                estimatedMonthlyCost: 120,
                savingsPercent: 82,
                migrationComplexity: 'medium',
                featureParity: 75,
                pros: ['Serverless per-message pricing', 'REST API', 'Zero infra management'],
                cons: ['Throughput limits', 'No Kafka Streams support'],
                freeTrialAvailable: true,
                openSource: false,
            },
        ],
        aiRationale: 'Confluent Standard is $680/month but your peak throughput is only 2,000 msg/sec. Redpanda is a drop-in Kafka replacement with lower resource needs. For your volume, Upstash per-message pricing could slash costs by 82%.',
    },
    'svc-auth0': {
        service: DETECTED_SERVICES.find(s => s.id === 'svc-auth0')!,
        alternatives: [
            {
                id: 'alt-auth-clerk',
                name: 'Clerk',
                estimatedMonthlyCost: 125,
                savingsPercent: 72,
                migrationComplexity: 'medium',
                featureParity: 90,
                pros: ['Superior DX', 'Pre-built UI components', 'Active user pricing'],
                cons: ['Less enterprise SSO options', 'Newer platform'],
                freeTrialAvailable: true,
                openSource: false,
            },
            {
                id: 'alt-auth-keycloak',
                name: 'Keycloak (Self-Hosted)',
                estimatedMonthlyCost: 30,
                savingsPercent: 93,
                migrationComplexity: 'high',
                featureParity: 95,
                pros: ['Full OIDC/SAML support', 'Open-source', 'Complete control'],
                cons: ['Self-managed infrastructure', 'Complex initial setup'],
                freeTrialAvailable: false,
                openSource: true,
            },
        ],
        aiRationale: 'Auth0 Professional at $450/month is high for 8,200 MAU. Clerk charges per active user (~$0.02/MAU) which suits your scale. Keycloak eliminates the SaaS cost entirely if your team can manage the deployment.',
    },
    'svc-elasticsearch': {
        service: DETECTED_SERVICES.find(s => s.id === 'svc-elasticsearch')!,
        alternatives: [
            {
                id: 'alt-es-meilisearch',
                name: 'Meilisearch Cloud',
                estimatedMonthlyCost: 65,
                savingsPercent: 88,
                migrationComplexity: 'medium',
                featureParity: 78,
                pros: ['Instant search', 'Simple API', 'Typo tolerance', 'Open-source core'],
                cons: ['Not suited for analytics', 'Smaller feature set'],
                freeTrialAvailable: true,
                openSource: true,
            },
            {
                id: 'alt-es-typesense',
                name: 'Typesense Cloud',
                estimatedMonthlyCost: 85,
                savingsPercent: 85,
                migrationComplexity: 'medium',
                featureParity: 80,
                pros: ['Sub-50ms search', 'Easy setup', 'Built-in geo search'],
                cons: ['Limited aggregation', 'Smaller community'],
                freeTrialAvailable: true,
                openSource: true,
            },
        ],
        aiRationale: 'Your Elastic Cloud instance indexes 120K product documents with simple full-text queries. Meilisearch and Typesense excel at exactly this use case with 85-88% cost savings and faster response times for end-user search.',
    },
    'svc-cloudfront': {
        service: DETECTED_SERVICES.find(s => s.id === 'svc-cloudfront')!,
        alternatives: [
            {
                id: 'alt-cdn-cloudflare',
                name: 'Cloudflare (Free/Pro)',
                estimatedMonthlyCost: 20,
                savingsPercent: 89,
                migrationComplexity: 'low',
                featureParity: 95,
                pros: ['Generous free tier', 'DDoS protection included', 'Edge Workers'],
                cons: ['Vendor lock-in on Workers', 'Rate limiting on free tier'],
                freeTrialAvailable: true,
                openSource: false,
            },
            {
                id: 'alt-cdn-bunny',
                name: 'Bunny CDN',
                estimatedMonthlyCost: 15,
                savingsPercent: 92,
                migrationComplexity: 'low',
                featureParity: 82,
                pros: ['$0.01/GB pricing', '114 PoPs', 'Simple dashboard'],
                cons: ['No edge compute', 'Less enterprise features'],
                freeTrialAvailable: true,
                openSource: false,
            },
        ],
        aiRationale: 'CloudFront is $180/month for ~2 TB transfer. Cloudflare\'s free tier includes unlimited bandwidth with Pro at $20/month for advanced features. Bunny CDN offers the lowest pure-CDN cost at $0.01/GB.',
    },
    'svc-s3': {
        service: DETECTED_SERVICES.find(s => s.id === 'svc-s3')!,
        alternatives: [
            {
                id: 'alt-s3-r2',
                name: 'Cloudflare R2',
                estimatedMonthlyCost: 15,
                savingsPercent: 88,
                migrationComplexity: 'low',
                featureParity: 85,
                pros: ['S3-compatible API', 'Zero egress fees', 'Workers integration'],
                cons: ['Fewer lifecycle policies', 'No cross-region replication'],
                freeTrialAvailable: true,
                openSource: false,
            },
            {
                id: 'alt-s3-backblaze',
                name: 'Backblaze B2',
                estimatedMonthlyCost: 18,
                savingsPercent: 85,
                migrationComplexity: 'low',
                featureParity: 78,
                pros: ['S3-compatible', '$0.005/GB storage', 'Free egress with CDN partners'],
                cons: ['Single region', 'Fewer integrations'],
                freeTrialAvailable: true,
                openSource: false,
            },
        ],
        aiRationale: 'S3 egress fees are a hidden cost driver. Cloudflare R2 offers zero egress with an S3-compatible API — a near drop-in replacement. Your 800 GB of stored assets would cost $12/month vs. $120 on S3 (including egress).',
    },
    'svc-k8s': {
        service: DETECTED_SERVICES.find(s => s.id === 'svc-k8s')!,
        alternatives: [
            {
                id: 'alt-k8s-koyeb',
                name: 'Koyeb',
                estimatedMonthlyCost: 190,
                savingsPercent: 74,
                migrationComplexity: 'medium',
                featureParity: 70,
                pros: ['Zero-config deploys', 'Global edge network', 'Git-push deploys'],
                cons: ['No raw K8s access', 'Less flexibility'],
                freeTrialAvailable: true,
                openSource: false,
            },
            {
                id: 'alt-k8s-coolify',
                name: 'Coolify (Self-Hosted PaaS)',
                estimatedMonthlyCost: 80,
                savingsPercent: 89,
                migrationComplexity: 'high',
                featureParity: 65,
                pros: ['Open-source Heroku/Vercel alternative', 'Docker-native', 'One-click deploys'],
                cons: ['Self-managed servers', 'Smaller community', 'No auto-scaling'],
                freeTrialAvailable: false,
                openSource: true,
            },
        ],
        aiRationale: 'EKS control plane costs $73/month before any worker nodes. For a 12-service architecture, a PaaS like Koyeb eliminates cluster management overhead. Coolify on Hetzner gives Heroku-like DX at a fraction of the cost.',
    },
    'svc-splunk': {
        service: DETECTED_SERVICES.find(s => s.id === 'svc-splunk')!,
        alternatives: [
            {
                id: 'alt-log-loki',
                name: 'Grafana Loki',
                estimatedMonthlyCost: 60,
                savingsPercent: 90,
                migrationComplexity: 'medium',
                featureParity: 80,
                pros: ['Open-source', 'Label-based indexing', 'Grafana native integration'],
                cons: ['No full-text indexing', 'Requires Grafana for querying'],
                freeTrialAvailable: true,
                openSource: true,
            },
            {
                id: 'alt-log-betterstack',
                name: 'Better Stack (Logtail)',
                estimatedMonthlyCost: 85,
                savingsPercent: 86,
                migrationComplexity: 'low',
                featureParity: 82,
                pros: ['SQL-based querying', 'Live tail', 'Beautiful UI', 'Generous free tier'],
                cons: ['Less powerful than Splunk SPL', 'Fewer integrations'],
                freeTrialAvailable: true,
                openSource: false,
            },
        ],
        aiRationale: 'Splunk Cloud at $620/month is premium pricing for 15 GB/day ingest. Grafana Loki can handle the same volume at $60/month with label-based log aggregation. Better Stack offers a friendlier UX with SQL-based querying at 86% savings.',
    },
}