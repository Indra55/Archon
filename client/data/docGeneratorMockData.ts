export type DocStatus = 'current' | 'stale' | 'generating' | 'needs_review'
export type TemplateId = 'api' | 'adr' | 'runbook' | 'postmortem'

export interface DocFile {
  id: string
  path: string
  label: string
  originalContent: string
  generatedContent: string
  hunks: Array<{ id: number; startLine: number; endLine: number; summary: string }>
}

export interface DocService {
  id: string
  slug: string
  name: string
  status: DocStatus
  lastUpdated: string
  docFiles: DocFile[]
}

export const TEMPLATES: Record<TemplateId, { label: string; description: string }> = {
  api: { label: 'API Reference', description: 'OpenAPI-style endpoint documentation' },
  adr: { label: 'ADR', description: 'Architecture Decision Record' },
  runbook: { label: 'Runbook', description: 'Operational runbook for on-call engineers' },
  postmortem: { label: 'Incident Postmortem', description: 'Post-incident analysis and learnings' },
}

export const DOC_TREE = [
  {
    serviceId: 'auth',
    serviceName: 'Auth Service',
    docs: [
      { id: 'auth-api', name: 'API Reference', health: 'stale' as const, daysSinceUpdate: 14, template: 'api' as TemplateId },
      { id: 'auth-adr-001', name: 'ADR-001 · JWT', health: 'fresh' as const, daysSinceUpdate: 3, template: 'adr' as TemplateId },
      { id: 'auth-runbook', name: 'Runbook', health: 'missing' as const, daysSinceUpdate: null, template: 'runbook' as TemplateId },
    ],
  },
  {
    serviceId: 'payment',
    serviceName: 'Payment Service',
    docs: [
      { id: 'payment-api', name: 'API Reference', health: 'fresh' as const, daysSinceUpdate: 2, template: 'api' as TemplateId },
      { id: 'payment-adr-002', name: 'ADR-002 · Idempotency', health: 'stale' as const, daysSinceUpdate: 21, template: 'adr' as TemplateId },
      { id: 'payment-runbook', name: 'Runbook', health: 'stale' as const, daysSinceUpdate: 30, template: 'runbook' as TemplateId },
    ],
  },
  {
    serviceId: 'order',
    serviceName: 'Order Service',
    docs: [
      { id: 'order-api', name: 'API Reference', health: 'fresh' as const, daysSinceUpdate: 1, template: 'api' as TemplateId },
      { id: 'order-adr-003', name: 'ADR-003 · Pagination', health: 'missing' as const, daysSinceUpdate: null, template: 'adr' as TemplateId },
    ],
  },
  {
    serviceId: 'system',
    serviceName: 'System ADRs',
    docs: [
      { id: 'sys-adr-004', name: 'ADR-004 · Event-Driven Payments', health: 'fresh' as const, daysSinceUpdate: 5, template: 'adr' as TemplateId },
    ],
  },
]

// ─── DIFF CONTENT ────────────────────────────────────────────────────────────
// The "original" is the current outdated doc.
// The "modified" is the AI-suggested update.
// Provide content for each doc ID. Others fall back to FALLBACK_DIFF.

export const DOC_CONTENT: Record<string, { original: string; modified: string; language: string }> = {
  'auth-api': {
    language: 'markdown',
    original: `# Auth Service API Reference\n\nLast updated: January 2024\n\n## POST /v1/auth/login\n\nAuthenticates a user with email and password.\n\n**Parameters:**\n- email: string\n- password: string\n\n**Returns:** JWT access token (expires in 1 hour)\n\n## POST /v1/auth/logout\n\nInvalidates the current session token.\n\n**Parameters:**\n- token: string (Bearer token in Authorization header)\n\n**Returns:** 204 No Content`,
    modified: `# Auth Service API Reference\n\nLast updated: auto-generated · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n## POST /v1/auth/login\n\nAuthenticates a user with email and password. Returns both an access\ntoken and a refresh token. Supports optional device-scoped sessions.\n\n**Parameters:**\n- email: string (required)\n- password: string (required)\n- deviceId: string (optional) — scopes the session to a specific device\n\n**Returns:**\n- accessToken: JWT string (expires in 15 minutes)\n- refreshToken: opaque string (expires in 30 days)\n- sessionId: UUID string\n\n## POST /v1/auth/refresh\n\nExchanges a valid refresh token for a new access token.\n\n**Parameters:**\n- refreshToken: string (required)\n\n**Returns:**\n- accessToken: JWT string (expires in 15 minutes)\n\n**Errors:**\n- 401 Unauthorized: refresh token expired or revoked\n\n## POST /v1/auth/logout\n\nInvalidates the current session. Revokes both the access and refresh\ntokens associated with the provided session.\n\n**Parameters:**\n- token: string (Bearer token in Authorization header)\n- revokeAll: boolean (optional) — revoke all sessions for this user\n\n**Returns:** 204 No Content`,
  },
  'payment-adr-002': {
    language: 'markdown',
    original: `# ADR-002: Idempotency in Payment Processing\n\n**Status:** Accepted\n**Date:** June 2023\n\n## Context\n\nPayment operations must be safe to retry without causing duplicate charges.\n\n## Decision\n\nUse a client-provided idempotency key passed as a request header.\n\n## Consequences\n\nClients must generate and track idempotency keys per payment attempt.`,
    modified: `# ADR-002: Idempotency in Payment Processing\n\n**Status:** Accepted\n**Date:** June 2023\n**Updated:** ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n## Context\n\nPayment operations must be safe to retry without causing duplicate charges.\nThe /v1/payments/charge endpoint is called from multiple services and mobile\nclients, all of which implement retry logic on network failure.\n\n## Decision\n\nUse a client-provided idempotency key passed as a required request body\nfield (\`idempotencyKey: string\`). The server stores the result of the\nfirst successful request keyed by this value for 24 hours. Subsequent\nrequests with the same key return the cached result without re-processing.\n\n## Implementation Details\n\n- Idempotency key must be a UUID v4 generated by the client\n- Key storage: Redis with a 24-hour TTL per key\n- Scope: per-endpoint (same key on different endpoints is treated independently)\n- Response header \`X-Idempotency-Replayed: true\` is set on cached responses\n\n## Consequences\n\n- Clients must generate a fresh UUID per payment attempt\n- Retry logic should reuse the same key for the same logical operation\n- Keys are not transferable across environments (staging vs production)`,
  },
  'auth-runbook': {
    language: 'markdown',
    original: `# Auth Service Runbook\n\nThis document does not exist yet.`,
    modified: `# Auth Service Runbook\n\n**Owner:** Platform Squad\n**On-call escalation:** #platform-oncall on Slack\n**Last generated:** ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n---\n\n## Service Overview\n\nThe Auth Service handles authentication and session management for all\ninternal and external clients. It issues JWT access tokens (15min TTL)\nand opaque refresh tokens (30-day TTL) stored in Redis.\n\n## Common Incidents\n\n### High Error Rate on /v1/auth/login\n\n**Symptoms:** 5xx responses, elevated latency on the login endpoint.\n\n**Steps:**\n1. Check Redis connectivity — \`redis-cli ping\` from auth-service pod\n2. Verify JWT signing key is mounted: \`kubectl describe secret jwt-signing-key\`\n3. Check upstream database connections in Datadog → Auth Service → DB pool\n4. If Redis is down: the service will fall back to DB-only mode (slower)\n\n### Token Refresh Loop\n\n**Symptoms:** Clients reporting continuous 401 errors after login.\n\n**Steps:**\n1. Check if token blacklist is populated unexpectedly\n2. Verify system clock skew between auth pods: \`kubectl exec ... date\`\n3. Force-revoke affected user sessions via admin endpoint if needed\n\n## Deployment Notes\n\n- Rolling deploy safe: yes (stateless, Redis handles session state)\n- Zero-downtime: ensure Redis is healthy before deploying\n- Post-deploy verification: check /health endpoint returns 200\n\n## Dependencies\n\n- Redis (session store) — critical, no fallback\n- PostgreSQL (user store) — critical\n- Kafka (session events) — non-critical, service degrades gracefully`,
  },
  'order-adr-003': {
    language: 'markdown',
    original: `# ADR-003: Pagination Strategy for Order Listings\n\nThis ADR does not exist yet.`,
    modified: `# ADR-003: Pagination Strategy for Order Listings\n\n**Status:** Accepted\n**Date:** ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}\n**Author:** Commerce Squad\n\n## Context\n\nThe Order Service's \`GET /v1/orders\` endpoint previously used offset-based\npagination. At scale (>10M orders), \`OFFSET 500000 LIMIT 50\` queries caused\nfull table scans, resulting in P99 latencies above 4 seconds and timeouts\nduring peak traffic.\n\n## Decision\n\nMigrate to cursor-based pagination using an opaque cursor derived from the\norder's \`createdAt\` timestamp and \`id\` fields.\n\n## API Change\n\n**Before:**\n\`GET /v1/orders?page=42&limit=50\`\n\n**After:**\n\`GET /v1/orders?cursor=eyJpZCI6MTIzNH0&limit=50\`\n\nResponse now includes \`nextCursor\` and \`hasMore\` fields.\n\n## Consequences\n\n- ✅ Eliminates full table scans — P99 latency reduced from 4s to 180ms\n- ✅ Stable results: new orders inserted mid-pagination do not shift results\n- ❌ Cannot jump to arbitrary pages — clients must paginate sequentially\n- ❌ Breaking change: existing clients using \`page\` param must be updated\n- Migration: a compatibility shim returns 400 with a migration guide`,
  },
}

export const FALLBACK_DIFF = {
  language: 'markdown',
  original: `# {docName}\n\nThis document exists but has no mock content defined.\nIn production, content is fetched from the repository.`,
  modified: `# {docName}\n\n**Auto-generated update detected.**\n\nThis document exists but has no mock content defined.\nIn production, the AI suggests updates based on recent commits.`,
}

// ─── HUNKS ───────────────────────────────────────────────────────────────────
// Define which line ranges constitute "hunks" per document.
// A hunk is a contiguous block of changes the engineer reviews as a unit.

export const HUNKS: Record<string, Array<{ id: number; startLine: number; endLine: number; summary: string }>> = {
  'auth-api': [
    { id: 1, startLine: 1, endLine: 3, summary: 'Update "last updated" timestamp to auto-generated' },
    { id: 2, startLine: 5, endLine: 12, summary: 'Expand /login to document refresh token and deviceId' },
    { id: 3, startLine: 14, endLine: 23, summary: 'Add new /v1/auth/refresh endpoint documentation' },
    { id: 4, startLine: 25, endLine: 33, summary: 'Update /logout to include revokeAll parameter' },
  ],
  'payment-adr-002': [
    { id: 1, startLine: 5, endLine: 5, summary: 'Add "Updated" date field' },
    { id: 2, startLine: 10, endLine: 16, summary: 'Expand Context with retry scenario details' },
    { id: 3, startLine: 18, endLine: 26, summary: 'Expand Decision with UUID spec and Redis TTL details' },
    { id: 4, startLine: 28, endLine: 36, summary: 'Add new Implementation Details section' },
    { id: 5, startLine: 38, endLine: 42, summary: 'Expand Consequences with concrete guidance' },
  ],
  'auth-runbook': [
    { id: 1, startLine: 1, endLine: 50, summary: 'Generate full runbook from scratch (no prior content)' },
  ],
  'order-adr-003': [
    { id: 1, startLine: 1, endLine: 60, summary: 'Generate ADR-003 from scratch based on recent commits' },
  ],
}

// ─── CONTEXT REASONING ───────────────────────────────────────────────────────
// Shown in the context sidebar for each hunk.

export const HUNK_REASONING: Record<string, Record<number, {
  trigger: string
  commitRef: string
  commitMessage: string
  confidence: 'high' | 'medium' | 'low'
  triggeringCode: string
  codeLanguage: string
}>> = {
  'auth-api': {
    1: {
      trigger: 'Documentation timestamp is 14 days old and the service has had 6 commits since.',
      commitRef: 'a3f92b1',
      commitMessage: 'feat(auth): add refresh token endpoint and deviceId support',
      confidence: 'high',
      triggeringCode: `// auth-service/routes/auth.ts:12
router.post('/refresh', async (req, res) => {
  const token = await refreshToken(req.body.refreshToken);
  res.json({ accessToken: token, expiresIn: 900 });
});`,
      codeLanguage: 'typescript',
    },
    2: {
      trigger: 'New parameters added to the login route: deviceId and refreshToken in response.',
      commitRef: 'a3f92b1',
      commitMessage: 'feat(auth): add refresh token endpoint and deviceId support',
      confidence: 'high',
      triggeringCode: `// auth-service/routes/auth.ts:34
router.post('/login', async (req, res) => {
  const { email, password, deviceId } = req.body;
  const { accessToken, refreshToken, sessionId } =
    await authService.login(email, password, deviceId);
  res.json({ accessToken, refreshToken, sessionId });
});`,
      codeLanguage: 'typescript',
    },
    3: {
      trigger: 'New /v1/auth/refresh endpoint added — no documentation existed for it.',
      commitRef: 'a3f92b1',
      commitMessage: 'feat(auth): add refresh token endpoint and deviceId support',
      confidence: 'high',
      triggeringCode: `// auth-service/routes/auth.ts:12
router.post('/refresh',
  applyLimit({ max: 30, window: '5m' }),
  async (req, res) => {
    try {
      const token = await refreshToken(req.body.refreshToken);
      res.json({ accessToken: token });
    } catch (e) {
      res.status(401).json({ error: 'Token expired or revoked' });
    }
  }
);`,
      codeLanguage: 'typescript',
    },
    4: {
      trigger: 'logout endpoint updated with revokeAll parameter in commit b1d3e5f.',
      commitRef: 'b1d3e5f',
      commitMessage: 'feat(auth): support revoking all user sessions on logout',
      confidence: 'medium',
      triggeringCode: `// auth-service/routes/auth.ts:58
router.post('/logout', authenticate, async (req, res) => {
  const { revokeAll } = req.body;
  if (revokeAll) {
    await sessionService.revokeAll(req.user.id);
  } else {
    await sessionService.revoke(req.session.id);
  }
  res.status(204).send();
});`,
      codeLanguage: 'typescript',
    },
  },
  'payment-adr-002': {
    1: {
      trigger: 'ADR was last updated 21 days ago. 4 related commits have been merged since.',
      commitRef: 'c7a2d91',
      commitMessage: 'refactor(payment): move idempotency key to request body',
      confidence: 'high',
      triggeringCode: `// Updated to reflect body field instead of header`,
      codeLanguage: 'typescript',
    },
    2: {
      trigger: 'Context section lacked detail about retry scenarios and affected callers.',
      commitRef: 'c7a2d91',
      commitMessage: 'refactor(payment): move idempotency key to request body',
      confidence: 'medium',
      triggeringCode: `// payment-service/dto/charge.dto.ts
export class ChargeDto {
  @IsUUID(4)
  @IsNotEmpty()
  idempotencyKey: string;

  @IsPositive()
  amount: number;

  @IsString()
  currency: string;
}`,
      codeLanguage: 'typescript',
    },
    3: {
      trigger: 'Decision section was missing UUID spec, Redis TTL, and scope details added in recent commit.',
      commitRef: 'c7a2d91',
      commitMessage: 'refactor(payment): move idempotency key to request body',
      confidence: 'high',
      triggeringCode: `// payment-service/services/idempotency.service.ts
async storeResult(key: string, result: ChargeResult): Promise<void> {
  await this.redis.set(
    \`idempotency:\${key}\`,
    JSON.stringify(result),
    'EX',
    86400  // 24-hour TTL
  );
}`,
      codeLanguage: 'typescript',
    },
    4: {
      trigger: 'New Implementation Details section inferred from idempotency service code.',
      commitRef: 'c7a2d91',
      commitMessage: 'refactor(payment): move idempotency key to request body',
      confidence: 'medium',
      triggeringCode: `// payment-service/middleware/idempotency.middleware.ts
const cached = await redis.get(\`idempotency:\${key}\`);
if (cached) {
  res.setHeader('X-Idempotency-Replayed', 'true');
  return res.json(JSON.parse(cached));
}`,
      codeLanguage: 'typescript',
    },
    5: {
      trigger: 'Consequences section lacked practical guidance for client teams.',
      commitRef: 'c7a2d91',
      commitMessage: 'refactor(payment): move idempotency key to request body',
      confidence: 'low',
      triggeringCode: `// No direct code trigger — inferred from ADR context`,
      codeLanguage: 'typescript',
    },
  },
  'auth-runbook': {
    1: {
      trigger: 'No runbook existed. Generated from service topology, incident history, and dependency graph.',
      commitRef: 'multiple',
      commitMessage: 'Auto-generated from: service topology + INC-042 + INC-067 + dependency analysis',
      confidence: 'medium',
      triggeringCode: `// auth-service/health.ts
app.get('/health', async (req, res) => {
  const redisOk = await redis.ping();
  const dbOk = await db.query('SELECT 1');
  res.json({ status: 'ok', redis: redisOk, db: !!dbOk });
});`,
      codeLanguage: 'typescript',
    },
  },
  'order-adr-003': {
    1: {
      trigger: 'Order Service migrated from offset to cursor pagination 18 days ago. No ADR was created.',
      commitRef: 'd4f8c23',
      commitMessage: 'perf(order): migrate to cursor-based pagination, remove OFFSET queries',
      confidence: 'high',
      triggeringCode: `// order-service/repositories/order.repo.ts
async findAll(cursor?: string, limit = 50): Promise<OrderPage> {
  const where = cursor
    ? { createdAt: { lt: decodeCursor(cursor).createdAt } }
    : {};
  const orders = await this.db.orders.findMany({
    where, take: limit + 1, orderBy: { createdAt: 'desc' },
  });
  const hasMore = orders.length > limit;
  return {
    data: orders.slice(0, limit),
    nextCursor: hasMore ? encodeCursor(orders[limit - 1]) : null,
    hasMore,
  };
}`,
      codeLanguage: 'typescript',
    },
  },
}
