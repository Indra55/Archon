'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function FaqSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  useEffect(() => {
    if (!sectionRef.current || !headerRef.current) return

    const ctx = gsap.context(() => {
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
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const faqs = [
    {
      question: 'How does Archon integrate with our existing tools?',
      answer:
        'Archon integrates with popular version control systems (GitHub, GitLab), CI/CD platforms (GitHub Actions, GitLab CI), and documentation tools. Setup typically takes less than 5 minutes through our web interface.',
    },
    {
      question: 'What data do you store and how is it secured?',
      answer:
        'We only store metadata and architecture relationships, not your source code. All data is encrypted at rest and in transit. We comply with SOC 2, GDPR, and HIPAA standards. Your data never leaves your infrastructure with our on-premise option.',
    },
    {
      question: 'Can Archon work with monolithic architectures?',
      answer:
        'Absolutely! Archon works with any architecture pattern - monoliths, microservices, serverless, or hybrid. It analyzes service dependencies, data flows, and integration points regardless of your deployment model.',
    },
    {
      question: 'How long does it take to build the initial knowledge graph?',
      answer:
        'Most teams see a fully functional knowledge graph within 24-48 hours of setup. The time depends on codebase size. Our AI progressively builds and refines the graph as it analyzes your systems.',
    },
    {
      question: 'Do you offer enterprise SLAs and dedicated support?',
      answer:
        'Yes! Our Enterprise plan includes 24/7 dedicated support, 99.99% uptime SLA, on-premise deployment, custom workflows, and a dedicated account manager. Contact our sales team for custom arrangements.',
    },
    {
      question: 'Can I export reports and share architecture insights?',
      answer:
        'Yes, Archon generates detailed reports on architecture health, dependency analysis, and recommendations. You can export as PDF, CSV, or create shareable architecture visualizations for stakeholders.',
    },
  ]

  return (
    <section ref={sectionRef} id="faq" className="relative py-24 px-6 md:px-28">
      <div className="max-w-4xl">
        {/* Header */}
        <div ref={headerRef} className="mb-16">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Questions?</span>
          <h2 className="mt-4 font-[var(--font-bebas)] text-5xl md:text-7xl tracking-tight">Frequently Asked</h2>
          <p className="mt-6 font-mono text-sm text-muted-foreground">
            Everything you need to know about Archon. Can't find the answer? Contact our support team.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="group border border-border/40 rounded-lg overflow-hidden transition-all duration-300 hover:border-accent/30"
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-card/50 transition-colors"
              >
                <h3 className="font-[var(--font-bebas)] text-lg tracking-tight pr-4">{faq.question}</h3>
                <ChevronDown
                  size={20}
                  className={`text-accent flex-shrink-0 transition-transform duration-300 ${
                    expandedIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Expanded Answer */}
              {expandedIndex === index && (
                <div className="px-6 pb-6 border-t border-border/20 animate-in fade-in duration-200">
                  <p className="font-mono text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 p-8 rounded-lg border border-border/40 bg-card/30 text-center">
          <h3 className="font-[var(--font-bebas)] text-2xl tracking-tight mb-3">Still have questions?</h3>
          <p className="font-mono text-sm text-muted-foreground mb-6">
            Our support team is happy to help. Reach out anytime.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <a
              href="https://github.com/indra55/archon/issues"
              className="px-6 py-2 border border-accent/30 text-foreground font-mono text-xs uppercase tracking-widest rounded hover:border-accent hover:text-accent transition-colors"
            >
              Contact Us
            </a>
            <a
              href="#contact"
              className="px-6 py-2 border border-accent text-accent font-mono text-xs uppercase tracking-widest rounded hover:bg-accent hover:text-background transition-all"
            >
              Schedule a Call
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
