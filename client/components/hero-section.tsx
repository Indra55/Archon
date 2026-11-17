"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { SplitFlapText, SplitFlapMuteToggle, SplitFlapAudioProvider } from "@/components/split-flap-text"
import { AnimatedNoise } from "@/components/animated-noise"
import { BitmapChevron } from "@/components/bitmap-chevron"
import { LaserFlow } from "@/components/laser-flow"
import { Navbar } from "@/components/navbar"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return

    const ctx = gsap.context(() => {
      gsap.to(contentRef.current, {
        y: -100,
        opacity: 0,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="hero" className="relative min-h-screen flex flex-col items-center justify-center pl-6 md:pl-28 pr-6 md:pr-12 overflow-hidden pt-0">
      {/* Navbar */}
      <div className="absolute top-0 left-0 right-0 z-40 w-full">
        <Navbar />
      </div>

      {/* LaserFlow background effect */}
      <div className="absolute inset-0 pointer-events-none">
        <LaserFlow 
          className="w-full h-full"
          wispDensity={1.2}
          mouseSmoothTime={0.15}
          mouseTiltStrength={0.015}
          horizontalBeamOffset={0.0}
          verticalBeamOffset={-0.15}
          flowSpeed={0.4}
          verticalSizing={2.2}
          horizontalSizing={0.6}
          fogIntensity={0.35}
          fogScale={0.35}
          wispSpeed={12.0}
          wispIntensity={4.5}
          flowStrength={0.2}
          decay={1.0}
          falloffStart={1.1}
          fogFallSpeed={0.5}
          color="#A78BFA"
        />
      </div>
      <AnimatedNoise opacity={0.03} />



      {/* Main content */}
      <div ref={contentRef} className="flex-1 w-full relative z-10 flex flex-col items-end justify-center pt-40 pr-12">
        <SplitFlapAudioProvider>
          <div className="relative">
            <SplitFlapText text="Archon" speed={80} />
            <div className="mt-4">
              <SplitFlapMuteToggle />
            </div>
          </div>
        </SplitFlapAudioProvider>

        <div className="mt-10 max-w-lg text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Your codebase, connected.</p>
          <p className="mt-4 font-mono text-sm text-muted-foreground leading-relaxed">
            Archon turns code and documentation into connected engineering knowledge.
            Explore dependencies, ask questions about your codebase, and turn requirements into architecture blueprints.
          </p>
        </div>

        <div className="mt-8 flex flex-col md:flex-row items-center gap-6 justify-end pr-12">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-background font-mono text-xs uppercase tracking-widest rounded hover:bg-accent/90 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-accent/30"
          >
            Get Started
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <a
            href="#signals"
            className="group inline-flex items-center gap-3 border border-foreground/20 px-8 py-4 font-mono text-xs uppercase tracking-widest text-foreground hover:border-accent hover:text-accent transition-all duration-200 rounded"
          >
            <span>Learn More</span>
            <BitmapChevron className="transition-transform duration-[400ms] ease-in-out group-hover:rotate-45" />
          </a>
        </div>
      </div>


    </section>
  )
}
