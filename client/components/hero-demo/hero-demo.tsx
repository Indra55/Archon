"use client"

import { useEffect, useState, type CSSProperties } from "react"
import Link from "next/link"
import { ArrowDownLeft, ArrowLeft, ArrowRight, Check, Eye, EyeOff, Pause, Play } from "lucide-react"
import { HeroArtwork } from "./hero-artwork"
import { scenes } from "./graph-scenes"
import "./hero-demo.css"

export function HeroDemo() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [artOnly, setArtOnly] = useState(false)
  const [copied, setCopied] = useState(false)
  const [travel, setTravel] = useState(0)
  const scene = scenes[index]

  useEffect(() => {
    const sync = () => {
      const requested = new URLSearchParams(window.location.search).get("scene")
      const selected = scenes.findIndex(s => s.id === requested)
      setIndex(selected < 0 ? 0 : selected)
    }
    sync()
    window.addEventListener("popstate", sync)
    return () => window.removeEventListener("popstate", sync)
  }, [])

  function select(next: number) {
    const selected = (next + scenes.length) % scenes.length
    setIndex(selected)
    setCopied(false)
    setTravel(0)
    setArtOnly(false)
    const url = new URL(window.location.href)
    url.searchParams.set("scene", scenes[selected].id)
    window.history.replaceState(null, "", url)
  }

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement)?.tagName)) return
      if (event.key === "ArrowRight") { event.preventDefault(); select(index + 1) }
      if (event.key === "ArrowLeft") { event.preventDefault(); select(index - 1) }
      if (event.key === "Escape") { setArtOnly(false); window.dispatchEvent(new CustomEvent("archon-travel", { detail: 0 })) }
    }
    window.addEventListener("keydown", keydown)
    return () => window.removeEventListener("keydown", keydown)
  }, [index])

  async function copyLink() {
    try {
      const url = new URL(window.location.href)
      url.searchParams.set("scene", scene.id)
      await navigator.clipboard.writeText(url.href)
      setCopied(true)
    } catch {
      // The URL remains selectable when clipboard access is unavailable.
      window.prompt("Copy this concept link", window.location.href)
    }
  }

  return (
    <main className={`hero-lab${artOnly ? " hero-lab--art" : ""}`} style={{ "--scene-color": scene.color, "--scene-rgb": scene.rgb } as CSSProperties}>
      <HeroArtwork scene={scene.id} paused={paused} onTravel={(value: number) => setTravel(value)} />
      <div className="lab-vignette" aria-hidden="true" />

      <header className="lab-header">
        <Link href="/" className="lab-brand" aria-label="Archon home"><span className="lab-brand-mark" aria-hidden="true">Λ</span> ARCHON<span className="lab-header-divider" /><span className="lab-word">EXPLORATIONS</span></Link>
        <div className="lab-header-right"><span className="lab-experiment">NETWORK STUDIES / VOL. 03</span><Link href="/" className="lab-back"><ArrowLeft size={13} /> BACK TO SITE</Link></div>
      </header>

      <div className="lab-stage" id="hero-preview" role="region" aria-label={`${scene.name} hero preview`}>
        <div className="lab-crosshair lab-crosshair--left" aria-hidden="true">+</div>
        <div className="lab-crosshair lab-crosshair--right" aria-hidden="true">+</div>

        <div className={`lab-hero-copy${travel > 0.3 ? " is-traveling" : ""}`} key={scene.id}>
          <p className="lab-eyebrow"><span />{scene.tag}</p>
          <h1>ARCHON<span className="lab-title-dot">.</span></h1>
          <p className="lab-hero-subtitle">The intelligence behind<br />everything you build.</p>
          <div className="lab-hero-actions"><Link href="/signup" className="lab-cta">GET STARTED <ArrowRight size={15} /></Link><button className="lab-explore" onClick={() => { window.dispatchEvent(new CustomEvent("archon-travel", { detail: 1 })); }}>ENTER THE NETWORK <ArrowDownLeft size={14} /></button></div>
        </div>

        <div className="lab-scene-caption" aria-live="polite" aria-atomic="true">
          <div className="lab-caption-number">0{index + 1}<span>/ 06</span></div>
          <div key={scene.id} className="lab-caption-text"><p>{scene.name}</p><span>{scene.note}</span></div>
        </div>
        <div className="lab-orbit-label" aria-hidden="true"><span /> WEBGL / INTERACTIVE / REALTIME</div>
      </div>

      <section className="lab-controls" aria-label="Explore hero concepts">
        <div className="lab-controls-top">
          <p><ArrowDownLeft size={13} /><span>EXPLORE SIX CONNECTED WORLDS</span></p>
          <div className="lab-tools"><button onClick={() => { window.dispatchEvent(new CustomEvent("archon-travel", { detail: 0 })); }} aria-label="Reset camera">OVERVIEW <span className="lab-travel-track"><span style={{ width: `${travel * 100}%` }} /></span></button>
            <button onClick={() => setPaused(value => !value)} aria-label={paused ? "Play animation" : "Pause animation"} aria-pressed={paused}>{paused ? <Play size={13} /> : <Pause size={13} />}<span>{paused ? "PLAY" : "PAUSE"}</span></button>
            <button onClick={() => setArtOnly(value => !value)} aria-label={artOnly ? "Show hero text" : "View artwork only"} aria-pressed={artOnly}>{artOnly ? <Eye size={14} /> : <EyeOff size={14} />}<span>{artOnly ? "SHOW TEXT" : "ART ONLY"}</span></button>
          </div>
        </div>

        <div className="lab-scene-tabs" role="group" aria-label="Select a hero concept">
          {scenes.map((item, i) => (
            <button key={item.id} onClick={() => select(i)} className={`lab-scene-tab${index === i ? " is-active" : ""}`} aria-pressed={index === i} aria-controls="hero-preview">
              <span className="lab-tab-number">0{i + 1}</span>

              <span className="lab-tab-name">{item.name}</span><span className="lab-tab-indicator" />
            </button>
          ))}
        </div>

        <div className="lab-footer">
          <div className="lab-description" aria-live="polite"><p>{scene.description}</p><a href={scene.sourceUrl} target="_blank" rel="noreferrer">REFERENCE / {scene.source} ↗</a></div>
          <div className="lab-footer-actions"><button className="lab-copy" onClick={copyLink}>{copied ? <><Check size={12} /> LINK COPIED</> : "COPY CONCEPT LINK ↗"}</button><div className="lab-arrows"><button onClick={() => select(index - 1)} aria-label="Previous concept"><ArrowLeft size={15} /></button><span>0{index + 1} / 06</span><button onClick={() => select(index + 1)} aria-label="Next concept"><ArrowRight size={15} /></button></div></div>
        </div>
      </section>
    </main>
  )
}
