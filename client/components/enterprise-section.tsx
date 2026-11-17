import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

export function EnterpriseSection() {
  return (
    <section id="enterprise" aria-labelledby="enterprise-title" className="relative scroll-mt-24 border-y border-border/30 py-24 pl-6 md:pl-28 pr-6 md:pr-12">
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Enterprise / Team workflows</span>
          <h2 id="enterprise-title" className="mt-4 font-[var(--font-bebas)] text-5xl md:text-7xl tracking-tight">SHARED CONTEXT.<br />BETTER DECISIONS.</h2>
          <p className="mt-6 max-w-lg font-mono text-sm text-muted-foreground leading-relaxed">
            Give your team a shared place to understand its systems. Start with one repository,
            explore the architecture together, and evaluate how Archon fits your engineering workflow.
          </p>
          <div className="mt-8 flex flex-wrap gap-5">
            <Link href="/setup" className="inline-flex items-center gap-3 rounded border border-accent px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-accent hover:bg-accent/10 transition-colors">
              Set up a workspace <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <Link href="/docs#deployment" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors">
              Read the deployment guide <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="divide-y divide-border/40 border-t border-border/40">
          {[
            ["01", "A workspace for the team", "Bring organization setup, team management, and repository knowledge into the same engineering dashboard."],
            ["02", "Context you can inspect", "Follow source references, inspect code relationships, and review generated architecture before putting a proposal into practice."],
            ["03", "A stack you can run", "Run the frontend, API, agent, and databases in your own environment. Configure your GitHub connection and AI provider for the repository you want to evaluate."],
          ].map(([number, title, description]) => (
            <div key={number} className="flex gap-5 py-7">
              <span className="mt-1 font-mono text-[10px] text-accent">{number}</span>
              <div>
                <h3 className="text-xl tracking-tight">{title}</h3>
                <p className="mt-3 font-mono text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
