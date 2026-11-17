'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import Link from 'next/link'

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false)

  const tiers = [
    {
      name: 'Starter',
      monthlyPrice: 99,
      annualPrice: 990,
      description: 'Perfect for small teams getting started',
      features: [
        'Up to 5 team members',
        'Basic architecture analysis',
        'Knowledge graph for 1 codebase',
        'Documentation auto-sync',
        'Codebase Q&A',
        'Blueprint export',
      ],
      cta: 'Explore Archon',
      href: '/signup',
      highlighted: false,
    },
    {
      name: 'Professional',
      monthlyPrice: 299,
      annualPrice: 2990,
      description: 'For growing engineering teams',
      features: [
        'Up to 25 team members',
        'Advanced architecture analysis',
        'Knowledge graph for 5 codebases',
        'Real-time documentation sync',
        'Team workspace',
        'Full CI/CD integration',
        'What-if impact analysis',
        'Architecture timeline',
      ],
      cta: 'Explore team workflows',
      href: '/signup',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      monthlyPrice: null,
      annualPrice: null,
      description: 'For large-scale organizations',
      features: [
        'Unlimited team members',
        'Custom architecture workflows',
        'Unlimited codebases',
        'Advanced knowledge graph features',
        'Deployment planning',
        'Architecture review workflows',
        'Self-hosted evaluation',
        'Custom workflows & automation',
      ],
      cta: 'Explore Enterprise',
      href: '#enterprise',
      highlighted: false,
    },
  ]

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="relative scroll-mt-24 py-24 pl-6 md:pl-28 pr-6 md:pr-12">
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">PRICING / PREVIEW</span>
          <h2 id="pricing-title" className="mt-4 font-[var(--font-bebas)] text-5xl md:text-7xl tracking-tight">ROOM TO BUILD</h2>
          <p className="mt-6 font-mono text-sm text-muted-foreground max-w-2xl mx-auto">
            Mock pricing for now. Prices, limits, and plan features below are illustrative.
            Billing and subscriptions are not active; explore the product without selecting a paid plan.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex justify-center items-center gap-4">
            <span className={`font-mono text-sm ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              type="button"
              role="switch"
              aria-label="Annual billing"
              aria-checked={isAnnual}
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 bg-accent/20 border border-accent/50 rounded-full transition-colors"
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-accent rounded-full transition-transform duration-300 ${
                  isAnnual ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`font-mono text-sm ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual
            </span>
            {isAnnual && (
              <span className="ml-2 px-2 py-1 bg-accent/20 border border-accent/50 text-accent font-mono text-[10px] uppercase tracking-widest rounded">
                Save 17%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              data-card
              className={`relative group rounded-lg border transition-all duration-300 p-8 ${
                tier.highlighted
                  ? 'border-accent/50 bg-card shadow-lg shadow-accent/20 md:scale-105'
                  : 'border-border/40 bg-card/50 hover:border-accent/30'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent/20 border border-accent/50 text-accent font-mono text-[10px] uppercase tracking-widest rounded">
                  Recommended
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-[var(--font-bebas)] text-2xl tracking-tight mb-2">{tier.name}</h3>
                <p className="font-mono text-xs text-muted-foreground">{tier.description}</p>
              </div>

              {/* Pricing */}
              <div className="mb-8">
                {tier.monthlyPrice ? (
                  <>
                    <div className="text-4xl font-bold text-accent">
                      ${isAnnual ? tier.annualPrice : tier.monthlyPrice}
                    </div>
                    <p className="font-mono text-xs text-muted-foreground mt-2">
                      per {isAnnual ? 'year' : 'month'}
                    </p>
                  </>
                ) : (
                  <div className="text-2xl font-mono text-muted-foreground">Custom pricing</div>
                )}
              </div>

              {/* CTA Button */}
              <Link
                href={tier.href}
                className={`block text-center w-full py-3 font-mono text-xs uppercase tracking-widest rounded transition-all duration-200 mb-8 ${
                  tier.highlighted
                    ? 'bg-accent text-background hover:bg-accent/90 shadow-lg hover:shadow-xl hover:shadow-accent/30'
                    : 'border border-accent/30 text-foreground hover:border-accent hover:text-accent'
                }`}
              >
                {tier.cta}
              </Link>

              {/* Features List */}
              <div className="space-y-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Includes:</p>
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check size={16} className="text-accent mt-1 flex-shrink-0" />
                    <span className="font-mono text-xs text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="font-mono text-sm text-muted-foreground mb-4">
            Evaluating Archon for your team?
          </p>
          <a
            href="#enterprise"
            className="inline-flex items-center gap-2 px-6 py-3 border border-accent/30 text-foreground font-mono text-xs uppercase tracking-widest rounded hover:border-accent hover:text-accent transition-colors"
          >
            Explore team deployment
          </a>
        </div>
      </div>
    </section>
  )
}
