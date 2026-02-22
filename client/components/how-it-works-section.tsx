'use client'

import { useEffect, useRef } from 'react'
import { Network, BookOpen, ZapOff, CheckCircle } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !headerRef.current || !stepsRef.current) return

    const ctx = gsap.context(() => {
      // Header
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

      // Steps animation
      const steps = stepsRef.current?.querySelectorAll('[data-step]')
      steps?.forEach((step, index) => {
        gsap.from(step, {
          x: -50,
          opacity: 0,
          duration: 0.8,
          delay: index * 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const steps = [
    {
      number: '01',
      title: 'Connect Your Codebase',
      description: 'Link your repositories, documentation, and deployment infrastructure. KA-CHOW ingests and analyzes your systems in real-time.',
      icon: Network,
    },
    {
      number: '02',
      title: 'Build Knowledge Graph',
      description: 'AI interprets services, APIs, data schemas, and architecture patterns. Creates a living graph that understands your system.',
      icon: BookOpen,
    },
    {
      number: '03',
      title: 'Ask & Understand',
      description: 'Use natural language to ask complex questions about your architecture. Get instant answers with code references and diagrams.',
      icon: ZapOff,
    },
    {
      number: '04',
      title: 'Make Better Decisions',
      description: 'Predict architecture change impacts, detect drift, and enforce standards. Build with confidence backed by AI intelligence.',
      icon: CheckCircle,
    },
  ]

  return (
    <section ref={sectionRef} id="how-it-works" className="relative py-24 px-6 md:px-28">
      <div className="max-w-7xl">
        {/* Header */}
        <div ref={headerRef} className="mb-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Get Started</span>
          <h2 className="mt-4 font-[var(--font-bebas)] text-5xl md:text-7xl tracking-tight">How It Works</h2>
          <p className="mt-6 font-mono text-sm text-muted-foreground max-w-2xl">
            Get your engineering brain up and running in minutes. KA-CHOW integrates seamlessly into your existing workflow.
          </p>
        </div>

        {/* Steps Grid */}
        <div ref={stepsRef} className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {steps.map((step, index) => {
            const IconComponent = step.icon
            return (
              <div key={step.number} data-step className="relative group">
                {/* Connection line for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-8 top-20 w-16 h-0.5 bg-gradient-to-r from-accent/50 to-transparent" />
                )}

                <div className="flex gap-6">
                  {/* Icon Container */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="absolute inset-0 bg-accent/20 blur-xl rounded-lg" />
                      <div className="relative w-16 h-16 rounded-lg border border-accent/50 bg-background/50 flex items-center justify-center group-hover:border-accent transition-all duration-300">
                        <IconComponent size={24} className="text-accent" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="font-mono text-xs uppercase tracking-widest text-accent">{step.number}</span>
                      <h3 className="font-[var(--font-bebas)] text-2xl tracking-tight">{step.title}</h3>
                    </div>
                    <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Card background */}
                <div className="absolute -inset-4 bg-gradient-to-r from-accent/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <p className="font-mono text-sm text-muted-foreground mb-6">
            Ready to transform your engineering knowledge?
          </p>
          <a
            href="#signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-background font-mono text-xs uppercase tracking-widest rounded hover:bg-accent/90 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-accent/30"
          >
            Start Free Trial Today
            <span>→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
