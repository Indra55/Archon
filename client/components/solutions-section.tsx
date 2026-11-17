"use client"

import Link from "next/link"
import { ArrowUpRight, ChevronDown } from "lucide-react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const caseStudies = [
  {
    id: "architecture",
    title: "From a product brief to a system blueprint",
    audience: "Architecture design",
    challenge: "A team needs to choose service boundaries, storage, and infrastructure before writing a new application.",
    workflow: "Describe the requirements to the Architecture Agent. Inspect the generated diagram, refine the design, then generate a scaffold from the selected architecture.",
    outcome: "A reviewable architecture, an exportable Markdown blueprint, and a ZIP of the generated project files.",
    href: "/dashboard/architect",
    preview: false,
  },
  {
    id: "knowledge-graph",
    title: "Find the connections inside an unfamiliar system",
    audience: "Knowledge graph",
    challenge: "Service relationships and implementation details are scattered across a repository.",
    workflow: "Index the source code, then explore the knowledge graph to trace files, functions, and their relationships. Follow those connections back to the implementation.",
    outcome: "A connected map of the indexed codebase that gives engineers a starting point for investigation.",
    href: "/dashboard/knowledge-graph",
    preview: false,
  },
  {
    id: "codebase-qa",
    title: "Answer the question without hunting through files",
    audience: "Codebase Q&A",
    challenge: "An engineer needs to understand where a behavior lives and how it works.",
    workflow: "Ask a question in plain language. Archon retrieves relevant code and summaries from the indexed repository and uses that context to build an answer.",
    outcome: "An explanation grounded in retrieved repository context, with source references to inspect alongside the answer.",
    href: "/dashboard/codebase-qa",
    preview: false,
  },
  {
    id: "impact-analysis",
    title: "Explore a change before committing to it",
    audience: "What-if analysis",
    challenge: "Changing a shared API can affect more than the service that owns it.",
    workflow: "Describe the proposed change in the What-If workspace. Review the affected components, dependency paths, and suggested migration steps in the example analysis.",
    outcome: "A structured way to discuss the possible impact and the checks a team should make before implementation.",
    href: "/dashboard/what-if",
    preview: true,
  },
  {
    id: "onboarding",
    title: "Give a new teammate a route through the codebase",
    audience: "Developer onboarding",
    challenge: "New engineers need context about the system, not just a list of repositories.",
    workflow: "Explore a role-based learning path with architecture context, relevant documents, and practical tasks. Open each module and track progress through the sample journey.",
    outcome: "A guided introduction that connects system concepts with concrete places to start exploring.",
    href: "/dashboard/onboarding",
    preview: true,
  },
  {
    id: "documentation",
    title: "Bring the documentation back into the conversation",
    audience: "Documentation",
    challenge: "An architectural change leaves the written explanation behind.",
    workflow: "Explore suggested documentation updates in the Doc Generator. Compare the existing text with the proposed revision and review the reasoning before accepting a change.",
    outcome: "A review workflow for keeping technical explanations aligned with engineering decisions.",
    href: "/dashboard/doc-generator",
    preview: true,
  },
  {
    id: "governance",
    title: "Make architecture standards part of review",
    audience: "CI/CD governance",
    challenge: "Teams agree on architecture rules, but those rules are difficult to follow across every change.",
    workflow: "Explore the CI Enforcer's sample policies, violations, and review results. Inspect the rule behind a finding and decide how it should be handled.",
    outcome: "A shared view of architecture expectations and the evidence engineers need to discuss a violation.",
    href: "/dashboard/ci-enforcer",
    preview: true,
  },
  {
    id: "evolution",
    title: "Understand how the architecture got here",
    audience: "Architecture timeline",
    challenge: "The current diagram does not explain the decisions that shaped the system.",
    workflow: "Move through the example architecture timeline, inspect historical snapshots, and compare changes between stages of the system's evolution.",
    outcome: "A visual account of architectural changes that helps teams discuss migrations and design tradeoffs.",
    href: "/dashboard/timeline",
    preview: true,
  },
  {
    id: "self-healing",
    title: "Turn a finding into a reviewable fix",
    audience: "Self-healing workflow",
    challenge: "Identifying a documentation or implementation gap still leaves the work of resolving it.",
    workflow: "Explore sample findings in the Self-Healer. Inspect a proposed patch, its explanation, and the review actions before deciding what should change.",
    outcome: "An example of a human-reviewed path from an identified gap to a proposed resolution.",
    href: "/dashboard/self-healer",
    preview: true,
  },
]

export function SolutionsSection() {
  return (
    <section id="solutions" aria-labelledby="solutions-title" className="relative scroll-mt-24 py-24 pl-6 md:pl-28 pr-6 md:pr-12">
      <div className="mb-14 max-w-2xl">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Solutions / Case studies</span>
        <h2 id="solutions-title" className="mt-4 font-[var(--font-bebas)] text-5xl md:text-7xl tracking-tight">CONTEXT AT WORK</h2>
        <p className="mt-6 font-mono text-sm text-muted-foreground leading-relaxed">
          From the first architecture decision to the next engineer joining your team.
          Explore illustrative case studies across Archon&apos;s workflows. Product previews use sample data.
        </p>
      </div>

      <div className="border-t border-border/40">
        {caseStudies.map((study, index) => (
          <details key={study.id} id={`solution-${study.id}`} className="group scroll-mt-24 border-b border-border/40" open={index === 0} onToggle={() => ScrollTrigger.refresh()}>
            <summary className="flex cursor-pointer list-none items-center gap-4 py-7 md:gap-8 [&::-webkit-details-marker]:hidden">
              <span className="font-mono text-[10px] text-accent">{String(index + 1).padStart(2, "0")}</span>
              <div className="flex-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{study.audience}</span>
                <h3 className="mt-2 text-lg md:text-2xl tracking-tight group-open:text-accent transition-colors">{study.title}</h3>
              </div>
              <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-accent transition-transform group-open:rotate-180" />
            </summary>
            <div className="pb-8 pl-8 md:pl-12">
              <span className="mb-6 inline-block border border-accent/30 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-accent">
                {study.preview ? "Product preview" : "Repository workflow"}
              </span>
              <div className="grid gap-6 md:grid-cols-3 md:gap-10">
                {[["The challenge", study.challenge], ["With Archon", study.workflow], ["The takeaway", study.outcome]].map(([label, text]) => (
                  <div key={label}>
                    <h4 className="font-mono text-[10px] uppercase tracking-widest text-foreground">{label}</h4>
                    <p className="mt-3 font-mono text-xs text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
              <Link href={study.href} className="mt-7 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent hover:underline underline-offset-4">
                {study.preview ? "Explore the preview" : "Open the workspace"} <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
