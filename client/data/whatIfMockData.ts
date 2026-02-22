export const MOCK_SCENARIO =
    "Deprecate the /v1/payments/charge endpoint"

export const QUICK_STATS = {
    directlyBroken: 3,
    transitivelyAffected: 7,
    affectedClients: 12,
    riskLevel: "CRITICAL" as const,
}

export const GRAPH_NODES = [
    { id: "gateway", label: "API Gateway", type: "gateway", state: "unaffected" },
    { id: "auth", label: "Auth Service", type: "service", state: "unaffected" },
    { id: "payment", label: "Payment Service", type: "service", state: "direct" },
    { id: "order", label: "Order Service", type: "service", state: "transitive" },
    { id: "notification", label: "Notification Service", type: "service", state: "unaffected" },
    { id: "analytics", label: "Analytics Service", type: "service", state: "transitive" },
    { id: "checkout", label: "Checkout Service", type: "service", state: "direct" },
    { id: "billing", label: "Billing Service", type: "service", state: "direct" },
]

export const GRAPH_EDGES = [
    { id: "e1", source: "gateway", target: "auth", label: "REST" },
    { id: "e2", source: "gateway", target: "payment", label: "REST" },
    { id: "e3", source: "gateway", target: "order", label: "REST" },
    { id: "e4", source: "checkout", target: "payment", label: "REST" },
    { id: "e5", source: "billing", target: "payment", label: "gRPC" },
    { id: "e6", source: "order", target: "payment", label: "gRPC" },
    { id: "e7", source: "payment", target: "analytics", label: "Event" },
    { id: "e8", source: "order", target: "notification", label: "Event" },
]

export const IMPACT_EDGES = ["e2", "e4", "e5", "e6", "e7"]

export const DIRECTLY_BROKEN = [
    {
        id: 1,
        name: "Payment Service",
        severity: "critical" as const,
        reason: "Directly exposes /v1/payments/charge as its primary charge endpoint. This is the canonical implementation — removing it breaks the service's core function.",
        locations: [
            { filename: "payment.service.ts", line: 142 },
            { filename: "payment.service.ts", line: 198 },
            { filename: "checkout.controller.ts", line: 87 },
        ],
        effort: "HIGH (8–12 hrs)",
        owner: "Payments Squad",
    },
    {
        id: 2,
        name: "Checkout Service",
        severity: "critical" as const,
        reason: "Calls /v1/payments/charge synchronously during the checkout flow. With no fallback, every checkout attempt will fail hard.",
        locations: [
            { filename: "checkout.flow.ts", line: 312 },
            { filename: "checkout.flow.ts", line: 389 },
        ],
        effort: "HIGH (6–10 hrs)",
        owner: "Commerce Squad",
    },
    {
        id: 3,
        name: "Billing Service",
        severity: "high" as const,
        reason: "Calls this endpoint via gRPC for subscription renewal. Monthly billing jobs will begin failing silently on the next scheduled run.",
        locations: [
            { filename: "billing.scheduler.ts", line: 56 },
        ],
        effort: "MEDIUM (3–5 hrs)",
        owner: "Payments Squad",
    },
]

export const TRANSITIVELY_AFFECTED = [
    {
        id: 4,
        name: "Order Service",
        severity: "high" as const,
        reason: "Depends on Payment Service for order confirmation. Failed payments will leave orders in a pending state with no resolution path.",
        chain: ["Order Service", "Payment Service", "/v1/payments/charge"],
        effort: "MEDIUM (4–6 hrs)",
        owner: "Commerce Squad",
    },
    {
        id: 5,
        name: "Analytics Service",
        severity: "medium" as const,
        reason: "Consumes payment events published after a successful charge. With no charges completing, revenue analytics will show zero for the affected period.",
        chain: ["Analytics Service", "Payment Service", "/v1/payments/charge"],
        effort: "LOW (1–2 hrs)",
        owner: "Data Squad",
    },
]

export const API_CLIENTS = [
    { id: 1, name: "iOS Mobile App", impact: "high" as const, how: "Uses endpoint in 2 checkout screens — direct user-facing failure" },
    { id: 2, name: "Android Mobile App", impact: "high" as const, how: "Calls endpoint for in-app purchases — payment flow will break" },
    { id: 3, name: "Partner API Consumer", impact: "medium" as const, how: "Registered a webhook on this endpoint for third-party payments" },
    { id: 4, name: "Admin Dashboard", impact: "low" as const, how: "Manual refund flow only — affects ops team, not end users" },
    { id: 5, name: "Merchant Portal", impact: "medium" as const, how: "Embedded payment widget calls this endpoint for merchant transactions" },
]

export const SCHEMA_DIFF = {
    before: [
        "POST /v1/payments/charge",
        "  body: {",
        "    amount:      number    (required)",
        "    currency:    string    (required)",
        "    customerId:  string    (required)",
        "    metadata:    object    (optional)",
        "  }",
        "  returns: { chargeId, status, timestamp }",
    ],
    after: [
        "POST /v2/payments/charge   ← new versioned endpoint",
        "  body: {",
        "    amount:         number    (required)",
        "    currency:       string    (required)",
        "    customerId:     string    (required)",
        "    idempotencyKey: string    (required)  ← NEW",
        "    metadata:       object    (optional)",
        "  }",
        "  returns: { chargeId, status, timestamp, idempotencyKey }",
        "",
        "DELETE /v1/payments/charge  ← deprecated, returns 410 Gone",
    ],
}

export const COMPLEXITY_SCORE = 72

export const COMPLEXITY_EXPLANATION =
    "This migration scores HIGH complexity because it affects 3 directly " +
    "dependent services, 2 external mobile clients, and a registered partner " +
    "webhook — each requiring independent coordination. The synchronous nature " +
    "of the checkout dependency means there is no safe gradual rollout without " +
    "a versioned shim endpoint. Estimated total migration window: 3–4 weeks."

export const MITIGATION_STEPS = [
    {
        id: 1,
        text: "Create a versioned shim endpoint /v2/payments/charge with idempotency support",
        actionLabel: "View Implementation Guide",
        actionType: "link" as const,
    },
    {
        id: 2,
        text: "Notify 5 client teams of the deprecation timeline via email",
        actionLabel: "Open Pre-drafted Email",
        actionType: "email" as const,
    },
    {
        id: 3,
        text: "Update Payment Service — 3 file changes required to point to /v2",
        actionLabel: "View Diff",
        actionType: "diff" as const,
    },
    {
        id: 4,
        text: "Add X-Deprecated and Sunset response headers to /v1 for a 90-day window",
        actionLabel: "View Implementation",
        actionType: "link" as const,
    },
    {
        id: 5,
        text: "Regenerate client SDKs after updating the OpenAPI spec for /v2",
        actionLabel: "Open Doc Generator",
        actionType: "navigate" as const,
        navigateTo: "/dashboard/doc-generator",
    },
]

export const SECTION_LABELS: Record<string, string> = {
    'impact-graph': 'Impact Visualization',
    'directly-broken': 'Directly Broken Services',
    'transitively-affected': 'Transitively Affected',
    'api-clients': 'Affected API Clients',
    'schema-changes': 'Schema Changes Required',
    'complexity': 'Migration Complexity',
    'mitigation': 'Suggested Mitigation Steps',
}

export const SECTION_META: Record<string, { count?: number | string; badge?: string }> = {
    'directly-broken': { count: 3 },
    'transitively-affected': { count: 7 },
    'api-clients': { count: 12 },
    'schema-changes': { count: 2 },
    'complexity': { badge: 'HIGH' },
    'mitigation': { count: 5 },
}

export const CODE_SNIPPETS: Record<string, { language: string; code: string }> = {
    "payment.service.ts:142": {
        language: "typescript",
        code: `async chargeCustomer(dto: ChargeDto): Promise<ChargeResult> {
  // Primary charge handler — calls /v1/payments/charge internally
  const response = await this.httpClient.post('/v1/payments/charge', {
    amount:     dto.amount,
    currency:   dto.currency,
    customerId: dto.customerId,
    metadata:   dto.metadata ?? {},
  });
  return { chargeId: response.data.chargeId, status: response.data.status };
}`,
    },
    "payment.service.ts:198": {
        language: "typescript",
        code: `async retryFailedCharge(chargeId: string): Promise<void> {
  const original = await this.db.charges.findOne({ id: chargeId });
  await this.httpClient.post('/v1/payments/charge', {
    amount:     original.amount,
    currency:   original.currency,
    customerId: original.customerId,
  });
}`,
    },
    "checkout.controller.ts:87": {
        language: "typescript",
        code: `@Post('/checkout/complete')
async completeCheckout(@Body() body: CheckoutBody) {
  const charge = await this.paymentService.chargeCustomer({
    amount:     body.totalAmount,
    currency:   body.currency,
    customerId: body.userId,
  });
  if (charge.status !== 'succeeded') throw new PaymentFailedException();
  await this.orderService.confirmOrder(body.orderId, charge.chargeId);
}`,
    },
    "checkout.flow.ts:312": {
        language: "typescript",
        code: `const initiatePayment = async (cart: Cart, user: User) => {
  const result = await fetch('/v1/payments/charge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: cart.total, currency: 'USD', customerId: user.id }),
  });
  if (!result.ok) throw new Error('Payment initiation failed');
  return result.json();
};`,
    },
    "billing.scheduler.ts:56": {
        language: "typescript",
        code: `// Runs at 00:00 UTC on the 1st of each month
async renewSubscriptions(): Promise<void> {
  const due = await this.db.subscriptions.findAllDue();
  for (const sub of due) {
    await this.grpcClient.charge({
      endpoint: '/v1/payments/charge',
      amount:   sub.monthlyAmount,
      customerId: sub.customerId,
    });
  }
}`,
    },
}
