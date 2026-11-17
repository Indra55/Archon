import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "Archon — Documentation",
  description: "Set up Archon, index a repository, ask codebase questions, and generate architecture blueprints.",
}

const sections = [
  ["overview", "Overview"],
  ["quickstart", "Local setup"],
  ["repository", "Connect & index"],
  ["architecture", "Architecture agent"],
  ["deployment", "Deployment"],
  ["feature-status", "Feature status"],
]

const setupCommands = `npm run setup:env
npm install --prefix server
npm install --prefix client
uv venv --python 3.12 agent/.venv
uv pip install --python agent/.venv/bin/python -r agent/requirements.txt
npm run db:up
npm run dev`

function CodeBlock({ children }: { children: string }) {
  return <pre className="mt-5 overflow-x-auto rounded border border-border/40 bg-card/50 p-5 font-mono text-xs leading-loose text-foreground/90"><code>{children}</code></pre>
}

export default function DocsPage() {
  return (
    <main className="relative min-h-screen">
      <Navbar />
      <div className="grid-bg pointer-events-none fixed inset-0 opacity-30" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-32 md:px-12">
        <Link href="/" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent">
          <ArrowLeft size={13} aria-hidden="true" /> Back to Archon
        </Link>
        <div className="mt-10 border-b border-border/40 pb-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Archon / Documentation</span>
          <h1 className="mt-4 text-5xl md:text-7xl tracking-tight">GET TO KNOW<br />YOUR SYSTEM.</h1>
          <p className="mt-6 max-w-2xl font-mono text-sm text-muted-foreground leading-relaxed">
            A practical guide to running Archon, connecting a repository, and working with its engineering context.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-12 lg:grid-cols-[190px_1fr] lg:gap-20">
          <nav aria-label="Documentation sections" className="flex flex-wrap gap-4 lg:sticky lg:top-28 lg:flex-col lg:gap-6">
            {sections.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="font-mono text-xs text-muted-foreground hover:text-accent transition-colors">{label}</a>
            ))}
          </nav>

          <div className="min-w-0 space-y-16 [&_section]:scroll-mt-28 [&_h2]:text-3xl [&_h2]:tracking-tight [&_p]:mt-5 [&_p]:font-mono [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_li]:font-mono [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-muted-foreground">
            <section id="overview">
              <h2>01 / What is Archon?</h2>
              <p>Archon is an engineering dashboard that connects repository indexing, a code knowledge graph, codebase Q&amp;A, and architecture generation. It helps you explore an existing system and turn new requirements into a design you can review.</p>
              <p>The local stack runs a Next.js frontend, an Express API, and a Python agent. PostgreSQL with pgvector stores application data and vectors; Neo4j stores code relationships.</p>
              <Link href="/#solutions" className="mt-5 inline-flex items-center gap-2 font-mono text-xs text-accent hover:underline">Explore the case studies <ArrowUpRight size={14} aria-hidden="true" /></Link>
            </section>

            <section id="quickstart">
              <h2>02 / Run Archon locally</h2>
              <p>Start from the project checkout. You need Node.js 20+, Python 3.12, uv, and Docker Compose. The environment setup command generates local secrets and preserves existing environment files.</p>
              <CodeBlock>{setupCommands}</CodeBlock>
              <p>Open <a href="http://localhost:3000/setup" className="text-accent hover:underline">localhost:3000/setup</a> after the services start. Database schemas initialize on the first database start. Use <code className="text-foreground">npm run db:stop</code> to stop the databases while retaining local data.</p>
            </section>

            <section id="repository">
              <h2>03 / Connect and index a repository</h2>
              <ol className="mt-5 list-decimal space-y-4 pl-5">
                <li>Register a GitHub OAuth app with the homepage <code>http://localhost:3000</code> and callback <code className="break-all">http://localhost:5555/auth/github/callback</code>. Set <code>GITHUB_CLIENT_ID</code> and <code>GITHUB_CLIENT_SECRET</code> in <code>server/.env</code>.</li>
                <li>Set <code>OPENROUTER_API</code> in <code>agent/.env</code>. Your provider account needs access to the configured chat model and the <code>thenlper/gte-base</code> embedding model.</li>
                <li>Use the setup page to enter a repository URL and a GitHub token with access to the repository. Read-only indexing needs repository contents read permission.</li>
                <li>For command-line ingestion, set <code>GITHUB_TOKEN</code>, <code>GITHUB_REPO=owner/repo</code>, and <code>GITHUB_BRANCH</code> in <code>agent/.env</code>, then run the command below.</li>
              </ol>
              <CodeBlock>agent/.venv/bin/python agent/scripts/ingest_repo.py</CodeBlock>
              <p>Indexing parses supported source files, generates summaries and embeddings, and writes graph relationships and vectors. Start with a small repository: each file can make multiple AI requests. Organization setup alone does not index source code. After indexing, open Codebase Q&amp;A to ask questions about the repository.</p>
              <p>Restart the development services after editing environment files. Keep generated encryption secrets stable so saved tokens remain decryptable.</p>
            </section>

            <section id="architecture">
              <h2>04 / From requirements to a scaffold</h2>
              <ol className="mt-5 list-decimal space-y-4 pl-5">
                <li>Open the Architecture Agent and describe what you want to build, including constraints such as the stack, expected traffic, and integrations.</li>
                <li>Select Design Architecture to generate a design and blueprint. Select a diagram component to inspect its responsibility, or expand the canvas for a larger view.</li>
                <li>Use Modify Architecture to refine the proposal with the selected design as context.</li>
                <li>Select Scaffold This Project to generate files from that design. Download Scaffold exports the generated source and blueprint as a ZIP; Export Blueprint downloads Markdown.</li>
              </ol>
              <p>Review the generated design and code before using them. The web workflow exports files; it does not automatically publish a GitHub pull request.</p>
              <Link href="/dashboard/architect" className="mt-5 inline-flex items-center gap-2 font-mono text-xs text-accent hover:underline">Open the Architecture Agent <ArrowUpRight size={14} aria-hidden="true" /></Link>
            </section>

            <section id="deployment">
              <h2>05 / Understand the runtime</h2>
              <div className="mt-5 overflow-x-auto border border-border/40">
                <table className="w-full text-left font-mono text-xs">
                  <caption className="sr-only">Default local service addresses</caption>
                  <thead className="border-b border-border/40 text-foreground"><tr><th scope="col" className="p-4 font-normal">Service</th><th scope="col" className="p-4 font-normal">Local address</th></tr></thead>
                  <tbody className="divide-y divide-border/30 text-muted-foreground">
                    {[["Frontend", "localhost:3000"], ["Express API health", "localhost:5555/health"], ["Agent health", "localhost:8000/api/v1/health"], ["Neo4j browser", "localhost:7474"], ["PostgreSQL", "localhost:5433"]].map(([service, address]) => (
                      <tr key={service}><td className="p-4">{service}</td><td className="p-4">{address}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>Application data persists in the ignored <code>.local/</code> directory. Keep environment files and tokens out of version control. Local database credentials in the example configuration are for development.</p>
              <p>GitHub webhooks require a publicly reachable HTTPS endpoint and the same <code>GITHUB_WEBHOOK_SECRET</code> in the API and agent configuration. A local evaluation does not require a tunnel. PR creation and webhook installation need their corresponding GitHub write permissions.</p>
              <p>Running the application locally still uses the configured external AI provider for chat and embeddings. Review that provider&apos;s data handling and configure the repository scope before indexing private code.</p>
            </section>

            <section id="feature-status">
              <h2>06 / Working flows and product previews</h2>
              <p>Repository indexing, codebase Q&amp;A, graph storage, and the architecture-to-scaffold workflow are connected to the local services. They require the databases, provider credentials, and relevant repository access.</p>
              <p>Several dashboard workspaces, including onboarding, documentation suggestions, CI governance, what-if scenarios, the architecture timeline, and self-healing, include sample data to demonstrate the intended experience. Explore these as product previews rather than live reports about your repository.</p>
              <p>The pricing section is a mock presentation. Its plan prices and limits are illustrative; billing, subscriptions, enterprise service commitments, and a sales-booking flow are not implemented.</p>
              <Link href="/#pricing" className="mt-5 inline-flex items-center gap-2 font-mono text-xs text-accent hover:underline">View pricing preview <ArrowUpRight size={14} aria-hidden="true" /></Link>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
