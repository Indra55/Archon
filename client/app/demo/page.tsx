import type { Metadata } from "next"
import { HeroDemo } from "@/components/hero-demo/hero-demo"

export const metadata: Metadata = {
  title: "Archon — Hero explorations",
  description: "Six animated explorations of code, context, and connected intelligence.",
}

export default function DemoPage() {
  return <HeroDemo />
}
