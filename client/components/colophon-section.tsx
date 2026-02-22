"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function ColophonSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      // Header slide in
      if (headerRef.current) {
        gsap.from(headerRef.current, {
          x: -60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }

      // Grid columns fade up with stagger
      if (gridRef.current) {
        const columns = gridRef.current.querySelectorAll(":scope > div")
        gsap.from(columns, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }

      // Footer fade in
      if (footerRef.current) {
        gsap.from(footerRef.current, {
          y: 20,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 95%",
            toggleActions: "play none none reverse",
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="colophon"
      className="relative py-32 pl-6 md:pl-28 pr-6 md:pr-12 border-t border-border/30"
    >
      {/* Section header */}
      <div ref={headerRef} className="mb-16">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">04 / Intelligence</span>
        <h2 className="mt-4 font-[var(--font-bebas)] text-5xl md:text-7xl tracking-tight">ADVANCED CAPABILITIES</h2>
      </div>

      {/* Extended Features */}
      <div ref={gridRef} className="max-w-3xl">
        <div className="border border-border/40 p-8 md:p-12 bg-background/50 space-y-6">
          <div>
            <h3 className="font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight mb-4 text-accent">Architecture Timeline & Evolution</h3>
            <p className="font-mono text-sm text-foreground/80 leading-relaxed">
              Visualize your system architecture over time. Use timeline sliders to inspect historical architecture, observe transitions from monolith to microservices, and identify drift patterns.
            </p>
          </div>
          <div className="border-t border-border/30 pt-6">
            <h3 className="font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight mb-4 text-accent">Self-Healing Patcher</h3>
            <p className="font-mono text-sm text-foreground/80 leading-relaxed">
              Automatically detect gaps, generate code patches, create documentation, and open pull requests. Every fix is traced back to the knowledge graph for measurable system improvement.
            </p>
          </div>
          <div className="pt-4 border-t border-border/30 mt-6">
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
              KA-CHOW 2026 | The Autonomous Engineering Brain
            </p>
            <p className="font-mono text-xs text-accent mt-2 font-semibold">
              Your intelligent system knowledge companion
            </p>
          </div>
        </div>
      </div>

      {/* Bottom note */}
      <div
        ref={footerRef}
        className="mt-24 pt-8 border-t border-border/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          © 2026 KA-CHOW. Intelligent Engineering.
        </p>
        <p className="font-mono text-[10px] text-muted-foreground">Transform fragmented knowledge into unified intelligence.</p>
      </div>
    </section>
  )
}
