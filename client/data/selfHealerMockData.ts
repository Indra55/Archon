export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'deferred'

export type SuggestionCategory =
    | 'resilience'
    | 'documentation'
    | 'architecture'
    | 'performance'
    | 'security'

export interface SuggestionItem {
    id: string
    title: string
    detail: string              // 2–3 sentence explanation of the problem
    rationale: string           // why the AI flagged this — longer, technical
    category: SuggestionCategory
    serviceId: string
    serviceName: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    scoreImpact: number         // how many points approving adds to health score
    estimatedHours: number      // hours this fix would have taken manually
    status: SuggestionStatus
    detectedAt: string          // e.g. "2 hours ago"
    prTitle?: string            // pre-generated PR title if approved
    prBranch?: string           // e.g. "fix/payment-retry-logic"
    affectedFiles: string[]     // list of files changed by this fix
    diff: {
        language: string
        original: string
        modified: string
    }
    relatedIncident?: string    // e.g. "INC-067"
    codeEvidence: string        // the specific code that triggered this detection
    codeEvidenceFile: string    // e.g. "payment.service.ts:89"
}

export const SUGGESTIONS: SuggestionItem[] = [
    {
        id: 's1',
        title: 'Missing retry logic on Stripe HTTP client',
        detail: 'The Stripe HTTP client in Payment Service makes direct calls with no retry logic. A single transient failure causes the entire charge to fail, which contributed to INC-067.',
        rationale: 'Static analysis detected that the axios instance calling api.stripe.com has no interceptors, no retry configuration, and no timeout set. The pattern matches the root cause documented in INC-067. Three services in the codebase already use the recommended opossum circuit breaker pattern — this one was missed.',
        category: 'resilience',
        serviceId: 'payment',
        serviceName: 'Payment Service',
        severity: 'critical',
        scoreImpact: 6,
        estimatedHours: 4,
        status: 'pending',
        detectedAt: '2 hours ago',
        prTitle: 'fix(payment): add retry logic and circuit breaker to Stripe client',
        prBranch: 'fix/payment-stripe-retry',
        affectedFiles: ['src/clients/stripe.client.ts', 'src/config/http.config.ts'],
        relatedIncident: 'INC-067',
        codeEvidence: `const stripeClient = axios.create({
  baseURL: 'https://api.stripe.com',
  headers: { Authorization: \`Bearer \${config.STRIPE_KEY}\` },
  // ← no timeout, no retry, no circuit breaker
});`,
        codeEvidenceFile: 'payment.service.ts:89',
        diff: {
            language: 'typescript',
            original: `import axios from 'axios'
import { config } from '../config'

const stripeClient = axios.create({
  baseURL: 'https://api.stripe.com',
  headers: {
    Authorization: \`Bearer \${config.STRIPE_KEY}\`,
    'Content-Type': 'application/json',
  },
})

export const chargeCard = async (payload: ChargePayload) => {
  const response = await stripeClient.post('/v1/charges', payload)
  return response.data
}`,
            modified: `import axios from 'axios'
import CircuitBreaker from 'opossum'
import axiosRetry from 'axios-retry'
import { config } from '../config'

const stripeClient = axios.create({
  baseURL: 'https://api.stripe.com',
  timeout: 5000,
  headers: {
    Authorization: \`Bearer \${config.STRIPE_KEY}\`,
    'Content-Type': 'application/json',
  },
})

axiosRetry(stripeClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (err) => axiosRetry.isNetworkOrIdempotentRequestError(err),
})

const breakerOptions = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
}

const chargeBreaker = new CircuitBreaker(
  (payload: ChargePayload) => stripeClient.post('/v1/charges', payload),
  breakerOptions,
)

export const chargeCard = async (payload: ChargePayload) => {
  const response = await chargeBreaker.fire(payload)
  return (response as any).data
}`,
        },
    },
    {
        id: 's2',
        title: 'Redis connection pool has no size limit',
        detail: 'The Auth Service creates a Redis connection pool with no maximum size. Under traffic spikes, pool growth is unbounded — this was the direct cause of INC-042.',
        rationale: 'The ioredis client is initialised without a maxConnections option. Comparing Auth Service Redis config against the Payment Service (which has a maxConnections of 20 after INC-042 was fixed) confirms this gap. The knowledge graph shows Auth Service has had 2 Redis-related alerts in the last 90 days.',
        category: 'resilience',
        serviceId: 'auth',
        serviceName: 'Auth Service',
        severity: 'critical',
        scoreImpact: 5,
        estimatedHours: 2,
        status: 'pending',
        detectedAt: '5 hours ago',
        prTitle: 'fix(auth): cap Redis connection pool to prevent unbounded growth',
        prBranch: 'fix/auth-redis-pool-limit',
        affectedFiles: ['src/clients/redis.client.ts'],
        relatedIncident: 'INC-042',
        codeEvidence: `export const redis = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  // ← no maxConnections, no lazyConnect, no connectTimeout
})`,
        codeEvidenceFile: 'redis.client.ts:12',
        diff: {
            language: 'typescript',
            original: `import Redis from 'ioredis'
import { config } from '../config'

export const redis = new Redis({
  host:     config.REDIS_HOST,
  port:     config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
})`,
            modified: `import Redis from 'ioredis'
import { config } from '../config'

export const redis = new Redis({
  host:            config.REDIS_HOST,
  port:            config.REDIS_PORT,
  password:        config.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  connectTimeout:  3000,
  lazyConnect:     true,
  // Pool size cap — prevents unbounded growth during traffic spikes
  // Matches the Payment Service configuration after INC-042 remediation
  family:          4,
})

// Enforce connection limit via a separate pool wrapper
import { createPool } from 'generic-pool'

export const redisPool = createPool({
  create:  () => redis.duplicate(),
  destroy: (client) => client.quit(),
}, { max: 20, min: 2, acquireTimeoutMillis: 3000 })`,
        },
    },
    {
        id: 's3',
        title: 'Order Service has no timeout on Payment gRPC calls',
        detail: 'The Order Service calls Payment Service via gRPC with no deadline set. If Payment Service degrades, Order Service requests will hang indefinitely, blocking all order confirmations.',
        rationale: 'gRPC calls from order.service.ts to the Payment stub have no deadline option. Under the current traffic model (~88k calls/day), a 30s hang per request would exhaust the Order Service thread pool in approximately 40 seconds during a Payment outage. The What-If analysis for INC-067 confirmed this cascade path.',
        category: 'resilience',
        serviceId: 'order',
        serviceName: 'Order Service',
        severity: 'high',
        scoreImpact: 4,
        estimatedHours: 2,
        status: 'pending',
        detectedAt: '1 day ago',
        prTitle: 'fix(order): add gRPC deadline to Payment Service calls',
        prBranch: 'fix/order-grpc-deadline',
        affectedFiles: ['src/services/order.service.ts'],
        relatedIncident: 'INC-067',
        codeEvidence: `const chargeResult = await paymentStub.chargeCustomer(
  { amount: order.total, currency: 'USD', customerId: order.userId },
  // ← no deadline, no metadata, no retry policy
)`,
        codeEvidenceFile: 'order.service.ts:142',
        diff: {
            language: 'typescript',
            original: `const chargeResult = await paymentStub.chargeCustomer(
  {
    amount:     order.total,
    currency:   'USD',
    customerId: order.userId,
  }
)`,
            modified: `import { Metadata, CallCredentials, credentials } from '@grpc/grpc-js'

const deadline = new Date()
deadline.setSeconds(deadline.getSeconds() + 5)  // 5-second hard deadline

const chargeResult = await paymentStub.chargeCustomer(
  {
    amount:     order.total,
    currency:   'USD',
    customerId: order.userId,
  },
  { deadline }
)`,
        },
    },
    {
        id: 's4',
        title: 'Payment Service missing idempotency key validation',
        detail: 'The /v1/payments/charge endpoint accepts requests without validating that the idempotencyKey is a valid UUID v4, contradicting ADR-002 which mandates UUID v4 format.',
        rationale: 'ADR-002 specifies that idempotencyKey must be a UUID v4 generated by the client. The charge.dto.ts validator uses @IsString() but not @IsUUID(4). This means any string passes validation, breaking the idempotency guarantee — two requests with the same non-UUID key but different amounts could both succeed.',
        category: 'architecture',
        serviceId: 'payment',
        serviceName: 'Payment Service',
        severity: 'high',
        scoreImpact: 3,
        estimatedHours: 1,
        status: 'pending',
        detectedAt: '1 day ago',
        prTitle: 'fix(payment): enforce UUID v4 validation on idempotencyKey per ADR-002',
        prBranch: 'fix/payment-idempotency-validation',
        affectedFiles: ['src/dto/charge.dto.ts'],
        codeEvidence: `@IsString()
@IsNotEmpty()
idempotencyKey: string
// ← ADR-002 requires @IsUUID(4) — currently any string passes`,
        codeEvidenceFile: 'charge.dto.ts:18',
        diff: {
            language: 'typescript',
            original: `import { IsString, IsNotEmpty, IsPositive } from 'class-validator'

export class ChargeDto {
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string

  @IsPositive()
  amount: number

  @IsString()
  currency: string
}`,
            modified: `import { IsUUID, IsNotEmpty, IsPositive, IsString } from 'class-validator'

export class ChargeDto {
  @IsUUID(4, { message: 'idempotencyKey must be a valid UUID v4 (per ADR-002)' })
  @IsNotEmpty()
  idempotencyKey: string

  @IsPositive()
  amount: number

  @IsString()
  currency: string
}`,
        },
    },
    {
        id: 's5',
        title: 'Notification Service has no dead-letter queue for failed events',
        detail: 'When the Notification Service fails to process a Kafka message (e.g. email provider timeout), the message is silently dropped. There is no dead-letter queue or retry topic configured.',
        rationale: 'The Kafka consumer in notification.consumer.ts uses a try/catch that logs the error but does not re-queue or move the message to a dead-letter topic. In production, this means failed push notifications are permanently lost with no alerting. The Analytics Service consumer, by contrast, already implements DLQ routing.',
        category: 'resilience',
        serviceId: 'notification',
        serviceName: 'Notification Service',
        severity: 'high',
        scoreImpact: 4,
        estimatedHours: 3,
        status: 'pending',
        detectedAt: '2 days ago',
        prTitle: 'fix(notification): add dead-letter queue for failed Kafka event processing',
        prBranch: 'fix/notification-dlq',
        affectedFiles: ['src/consumers/notification.consumer.ts', 'src/config/kafka.config.ts'],
        codeEvidence: `} catch (err) {
  this.logger.error('Failed to process notification event', err)
  // ← message silently dropped — no DLQ, no retry, no alert
}`,
        codeEvidenceFile: 'notification.consumer.ts:58',
        diff: {
            language: 'typescript',
            original: `async processEvent(message: KafkaMessage): Promise<void> {
  try {
    const event = JSON.parse(message.value!.toString())
    await this.notificationService.dispatch(event)
  } catch (err) {
    this.logger.error('Failed to process notification event', err)
  }
}`,
            modified: `async processEvent(message: KafkaMessage): Promise<void> {
  try {
    const event = JSON.parse(message.value!.toString())
    await this.notificationService.dispatch(event)
  } catch (err) {
    this.logger.error('Failed to process notification event — routing to DLQ', err)

    // Route to dead-letter topic for manual inspection and replay
    await this.producer.send({
      topic: 'notification-events.DLQ',
      messages: [{
        value: message.value,
        headers: {
          'x-error':      Buffer.from(String(err)),
          'x-failed-at':  Buffer.from(new Date().toISOString()),
          'x-retry-count': Buffer.from('0'),
        },
      }],
    })

    // Emit alert metric for on-call monitoring
    this.metrics.increment('notification.dlq.routed')
  }
}`,
        },
    },
    {
        id: 's6',
        title: 'Analytics Service has no request timeout on Kafka consumer',
        detail: 'The Analytics Kafka consumer has no session timeout configured, meaning broker-side group rebalance can take up to the default 30 seconds — causing a 30-second gap in revenue metric data.',
        rationale: 'The Kafka consumer config in analytics.consumer.ts does not set sessionTimeout or heartbeatInterval. The Kafka broker default is 30 seconds, which is unusually long for a metrics consumer. The recommended value for near-real-time analytics is 6 seconds, matching what the Order Service uses.',
        category: 'performance',
        serviceId: 'analytics',
        serviceName: 'Analytics Service',
        severity: 'medium',
        scoreImpact: 2,
        estimatedHours: 1,
        status: 'deferred',
        detectedAt: '3 days ago',
        prTitle: 'perf(analytics): set Kafka session timeout for faster rebalance',
        prBranch: 'perf/analytics-kafka-timeout',
        affectedFiles: ['src/config/kafka.config.ts'],
        codeEvidence: `consumer = kafka.consumer({
  groupId: 'analytics-consumer-group',
  // ← no sessionTimeout, no heartbeatInterval — using broker defaults
})`,
        codeEvidenceFile: 'kafka.config.ts:34',
        diff: {
            language: 'typescript',
            original: `export const analyticsConsumer = kafka.consumer({
  groupId: 'analytics-consumer-group',
})`,
            modified: `export const analyticsConsumer = kafka.consumer({
  groupId:           'analytics-consumer-group',
  sessionTimeout:    6000,   // 6s — faster rebalance vs 30s default
  heartbeatInterval: 2000,   // Must be < sessionTimeout / 3
  rebalanceTimeout:  10000,
})`,
        },
    },
    {
        id: 's7',
        title: 'Auth Service has no rate limiting on token refresh endpoint',
        detail: 'The /v1/auth/refresh endpoint has no rate limiting applied. Unlike the login endpoint (which has a 30 req/5min limit), refresh is completely unprotected — a stolen refresh token could be used to generate unlimited access tokens.',
        rationale: 'The login route applies the applyLimit middleware but the refresh route, added in a later commit, does not. Refresh tokens have a 30-day TTL, making unlimited refresh a significant security gap. The fix mirrors the existing login rate limit configuration.',
        category: 'security',
        serviceId: 'auth',
        serviceName: 'Auth Service',
        severity: 'high',
        scoreImpact: 3,
        estimatedHours: 1,
        status: 'pending',
        detectedAt: '4 days ago',
        prTitle: 'fix(auth): add rate limiting to token refresh endpoint',
        prBranch: 'fix/auth-refresh-rate-limit',
        affectedFiles: ['src/routes/auth.ts'],
        codeEvidence: `router.post('/refresh', async (req, res) => {
  // ← no rate limit applied — login has one but refresh does not
  const token = await refreshToken(req.body.refreshToken)
  res.json({ accessToken: token })
})`,
        codeEvidenceFile: 'auth.ts:28',
        diff: {
            language: 'typescript',
            original: `router.post('/login',
  applyLimit({ max: 30, window: '5m' }),
  async (req, res) => { /* ... */ }
)

router.post('/refresh', async (req, res) => {
  const token = await refreshToken(req.body.refreshToken)
  res.json({ accessToken: token })
})`,
            modified: `router.post('/login',
  applyLimit({ max: 30, window: '5m' }),
  async (req, res) => { /* ... */ }
)

router.post('/refresh',
  applyLimit({ max: 20, window: '5m' }),  // slightly more lenient than login
  async (req, res) => {
    const token = await refreshToken(req.body.refreshToken)
    res.json({ accessToken: token })
  }
)`,
        },
    },
]

export const SCAN_DISCOVERY: SuggestionItem = {
    id: 's8',
    title: 'Order Service has no graceful shutdown handler',
    detail: 'The Order Service does not handle SIGTERM signals, meaning in-flight gRPC requests to Payment Service are aborted immediately on pod restart.',
    rationale: 'No process.on("SIGTERM") handler exists. Kubernetes sends SIGTERM before killing a pod — without a handler, active requests are cut off mid-flight. The other 3 services all implement graceful shutdown; this one was missed.',
    category: 'resilience',
    serviceId: 'order',
    serviceName: 'Order Service',
    severity: 'medium',
    scoreImpact: 2,
    estimatedHours: 1,
    status: 'pending',
    detectedAt: 'Just now',
    prTitle: 'fix(order): add graceful SIGTERM shutdown handler',
    prBranch: 'fix/order-graceful-shutdown',
    affectedFiles: ['src/main.ts'],
    codeEvidence: `// src/main.ts — no SIGTERM handler present
await app.listen(3000)
// ← process killed immediately on pod restart, no drain`,
    codeEvidenceFile: 'main.ts:18',
    diff: {
        language: 'typescript',
        original: `async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3000)
  console.log('Order Service running on port 3000')
}

bootstrap()`,
        modified: `async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Graceful shutdown — drain in-flight requests before exit
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received — closing Order Service gracefully')
    await app.close()
    process.exit(0)
  })

  await app.listen(3000)
  console.log('Order Service running on port 3000')
}

bootstrap()`,
    },
}

export const CATEGORY_LABELS: Record<SuggestionCategory, string> = {
    resilience: 'Resilience',
    documentation: 'Documentation',
    architecture: 'Architecture',
    performance: 'Performance',
    security: 'Security',
}

export const CATEGORY_ICONS: Record<SuggestionCategory, string> = {
    resilience: 'Shield',
    documentation: 'FileText',
    architecture: 'Network',
    performance: 'Zap',
    security: 'Lock',
}

export const SERVICES_IN_SUGGESTIONS = [
    { id: 'all', label: 'All Services' },
    { id: 'payment', label: 'Payment Service' },
    { id: 'auth', label: 'Auth Service' },
    { id: 'order', label: 'Order Service' },
    { id: 'notification', label: 'Notification Service' },
    { id: 'analytics', label: 'Analytics Service' },
]
