'use client'

import { NetworkWorld } from './network-world'

export function HeroArtwork({scene,paused,onTravel}) {
  return <div className="hero-artwork" key={scene}><NetworkWorld variant={scene} paused={paused} onTravel={onTravel}/></div>
}
