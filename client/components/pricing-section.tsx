'use client'

import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const [isAnnual, setIsAnnual] = useState(false)

  useEffect(() => {
    if (!sectionRef.current || !headerRef.current || !cardsRef.current) return

    const ctx = gsap.context(() => {
      // Header animation
      gsap.from(headerRef.current, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      })

      // Cards stagger animation
      gsap.from(cardsRef.current?.querySelectorAll('[data-card]'), {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 60%',
          toggleActions: 'play none none reverse',
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

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
        'Community support',
        'Basic CI/CD integration',
      ],
      cta: 'Start Free Trial',
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
        'Priority email support',
        'Full CI/CD integration',
        'What-if impact analysis',
        'Custom integrations',
      ],
      cta: 'Start Free Trial',
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
        '24/7 dedicated support',
        'SLA guarantee',
        'On-premise deployment option',
        'Custom workflows & automation',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ]

  return (
    <section ref={sectionRef} id="pricing" className="relative py-24 px-6 md:px-28">
      <div className="max-w-7xl">
        {/* Header */}
        <div ref={headerRef} className="mb-16 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">TRANSPARENT PRICING</span>
          <h2 className="mt-4 font-[var(--font-bebas)] text-5xl md:text-7xl tracking-tight">Choose Your Plan</h2>
          <p className="mt-6 font-mono text-sm text-muted-foreground max-w-2xl mx-auto">
            No hidden fees. No credit card required for trial. Start free and scale as you grow.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex justify-center items-center gap-4">
            <span className={`font-mono text-sm ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
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
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-8">
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
              <button
                className={`w-full py-3 font-mono text-xs uppercase tracking-widest rounded transition-all duration-200 mb-8 ${
                  tier.highlighted
                    ? 'bg-accent text-background hover:bg-accent/90 shadow-lg hover:shadow-xl hover:shadow-accent/30'
                    : 'border border-accent/30 text-foreground hover:border-accent hover:text-accent'
                }`}
              >
                {tier.cta}
              </button>

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
            Not sure which plan is right for you?
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3 border border-accent/30 text-foreground font-mono text-xs uppercase tracking-widest rounded hover:border-accent hover:text-accent transition-colors"
          >
            Schedule a demo
          </a>
        </div>
      </div>
    </section>
  )
}
