'use client'

import { useEffect, useRef } from 'react'
import { Star } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const testimonialsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !headerRef.current || !testimonialsRef.current) return

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

      gsap.from(testimonialsRef.current?.querySelectorAll('[data-testimonial]'), {
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

  const testimonials = [
    {
      quote:
        'KA-CHOW transformed how our team thinks about architecture. We went from scattered documentation to a living knowledge graph that actually guides our decisions.',
      author: 'Sarah Chen',
      role: 'VP of Engineering',
      company: 'TechCorp',
      avatar: '👩‍💼',
    },
    {
      quote:
        'The impact analysis feature alone saved us from three potential architectural disasters. Its like having a senior staff engineer reviewing every PR.',
      author: 'James Mitchell',
      role: 'Tech Lead',
      company: 'CloudSystems',
      avatar: '👨‍💼',
    },
    {
      quote:
        'Onboarding new engineers is now 10x faster. They can ask questions about the codebase and get instant, accurate answers. Its revolutionary.',
      author: 'Priya Patel',
      role: 'Engineering Manager',
      company: 'DataFlow',
      avatar: '👩‍🔬',
    },
  ]

  return (
    <section ref={sectionRef} id="testimonials" className="relative py-24 px-6 md:px-28">
      <div className="max-w-7xl">
        {/* Header */}
        <div ref={headerRef} className="mb-16 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Loved by Engineers</span>
          <h2 className="mt-4 font-[var(--font-bebas)] text-5xl md:text-7xl tracking-tight">
            Trusted by Leading Teams
          </h2>
          <p className="mt-6 font-mono text-sm text-muted-foreground max-w-2xl mx-auto">
            Join 500+ engineering teams transforming their knowledge management
          </p>
        </div>

        {/* Testimonials Grid */}
        <div ref={testimonialsRef} className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              data-testimonial
              className="group relative p-8 rounded-lg border border-border/40 bg-card/50 hover:border-accent/30 transition-all duration-300"
            >
              {/* Star Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-accent text-accent" />
                ))}
              </div>

              {/* Quote */}
              <p className="font-mono text-sm text-foreground leading-relaxed mb-6 italic">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-6 border-t border-border/20">
                <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center text-lg">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-[var(--font-bebas)] text-sm tracking-tight">{testimonial.author}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>

              {/* Background glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-accent/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </div>
          ))}
        </div>

        {/* Trust Metrics */}
        <div className="grid md:grid-cols-4 gap-8 text-center py-12 border-y border-border/20">
          <div>
            <div className="font-[var(--font-bebas)] text-4xl tracking-tight text-accent">500+</div>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mt-2">Teams Using</p>
          </div>
          <div>
            <div className="font-[var(--font-bebas)] text-4xl tracking-tight text-accent">50k+</div>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mt-2">Hours Saved</p>
          </div>
          <div>
            <div className="font-[var(--font-bebas)] text-4xl tracking-tight text-accent">99.9%</div>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mt-2">Uptime</p>
          </div>
          <div>
            <div className="font-[var(--font-bebas)] text-4xl tracking-tight text-accent">4.9</div>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mt-2">Stars Rating</p>
          </div>
        </div>
      </div>
    </section>
  )
}
