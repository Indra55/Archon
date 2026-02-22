'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Building2, Github, Key, ExternalLink, Loader2, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Shield } from 'lucide-react'

export default function OrgSetupPage() {
    const router = useRouter()
    const [orgName, setOrgName] = useState('')
    const [githubRepoUrl, setGithubRepoUrl] = useState('')
    const [githubToken, setGithubToken] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [checkingOrg, setCheckingOrg] = useState(true)
    const [generatedJoinCode, setGeneratedJoinCode] = useState<string | null>(null)

    // Check if org is already configured — if so, redirect
    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch('/api/org/status')
                const data = await res.json()
                if (data.configured) {
                    router.replace('/login')
                }
            } catch (e) {
                // ignore
            } finally {
                setCheckingOrg(false)
            }
        }
        check()
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/org/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    org_name: orgName,
                    github_repo_url: githubRepoUrl,
                    github_access_token: githubToken,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Setup failed')
                return
            }

            setSuccess(true)
            // Capture the join code from the response
            if (data.org?.join_code) {
                setGeneratedJoinCode(data.org.join_code)
            }
            // Longer timeout so admin can copy the join code
            setTimeout(() => {
                router.push('/dashboard/team')
            }, 8000)
        } catch (err) {
            setError('Failed to connect. Please check your inputs and try again.')
        } finally {
            setLoading(false)
        }
    }

    if (checkingOrg) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base">
                <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
        )
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-base relative overflow-hidden">
            {/* Background grid */}
            <div className="grid-bg fixed inset-0 opacity-20" aria-hidden="true" />
            <div className="noise-overlay" aria-hidden="true" />

            <motion.div
                className="w-full max-w-lg relative z-10"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber/10 border border-amber/30 mb-4">
                        <Shield className="w-7 h-7 text-amber" />
                    </div>
                    <h1 className="text-3xl font-bold text-primary font-sans tracking-tight">
                        Set up your workspace
                    </h1>
                    <p className="text-sm text-muted mt-2 font-mono">
                        Admin setup · Connect your repository
                    </p>
                </div>

                {/* Form Card */}
                <form onSubmit={handleSubmit}>
                    <div className="border border-dim rounded-xl bg-surface/80 backdrop-blur-sm p-6 space-y-5">

                        {/* Org Name */}
                        <div className="space-y-2">
                            <label className="block text-xs font-mono uppercase tracking-wider text-secondary">
                                Workspace Name
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                <input
                                    id="org-name-input"
                                    type="text"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    placeholder="Acme Tracker"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-elevated border border-dim rounded-lg font-mono text-sm text-primary placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
                                />
                            </div>
                        </div>

                        {/* GitHub Org URL */}
                        <div className="space-y-2">
                            <label className="block text-xs font-mono uppercase tracking-wider text-secondary">
                                GitHub Repository URL
                            </label>
                            <div className="relative">
                                <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                <input
                                    id="github-repo-url-input"
                                    type="url"
                                    value={githubRepoUrl}
                                    onChange={(e) => setGithubRepoUrl(e.target.value)}
                                    placeholder="https://github.com/acme-corp/tracker"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-elevated border border-dim rounded-lg font-mono text-sm text-primary placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
                                />
                            </div>
                        </div>

                        {/* GitHub Access Token */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-mono uppercase tracking-wider text-secondary">
                                    GitHub Access Token
                                </label>
                                <a
                                    href="https://github.com/settings/tokens/new?scopes=read:org,repo&description=KA-CHOW+Org+Token"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-mono text-accent hover:text-accent/80 transition-colors"
                                >
                                    How to generate a token
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                <input
                                    id="github-token-input"
                                    type="password"
                                    value={githubToken}
                                    onChange={(e) => setGithubToken(e.target.value)}
                                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-elevated border border-dim rounded-lg font-mono text-sm text-primary placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
                                />
                            </div>
                            <p className="text-[10px] font-mono text-muted/70">
                                Needs the <code className="text-accent/60">repo</code> scope
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-2 p-3 rounded-lg bg-red/10 border border-red/20"
                            >
                                <AlertTriangle className="w-4 h-4 text-red shrink-0 mt-0.5" />
                                <p className="text-xs font-mono text-red">{error}</p>
                            </motion.div>
                        )}

                        {/* Success + Join Code */}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                            >
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-green/10 border border-green/20">
                                    <CheckCircle2 className="w-4 h-4 text-green" />
                                    <p className="text-xs font-mono text-green">
                                        Workspace configured successfully!
                                    </p>
                                </div>
                                {generatedJoinCode && (
                                    <div className="p-4 rounded-lg bg-amber/5 border border-amber/30">
                                        <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Your Team's Join Code</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-2xl font-bold text-primary font-mono tracking-[0.15em]">
                                                {generatedJoinCode}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(generatedJoinCode)
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono font-bold bg-amber text-base hover:bg-amber/90 transition-all"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <p className="text-[10px] font-mono text-muted/60 mt-2">
                                            Share this code with your developers so they can join. Redirecting to team page...
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Submit */}
                        <button
                            id="setup-submit-btn"
                            type="submit"
                            disabled={loading || success}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-mono text-sm font-bold bg-accent text-base hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Validating & configuring...
                                </>
                            ) : success ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Configured!
                                </>
                            ) : (
                                <>
                                    Configure Workspace
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-between mt-6">
                    <Link
                        href="/login"
                        className="flex items-center gap-1.5 text-[10px] font-mono text-muted/60 hover:text-muted transition-colors"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Back to login
                    </Link>
                    <p className="text-[10px] font-mono text-muted/40">
                        KA-CHOW · Admin Setup
                    </p>
                </div>
            </motion.div>
        </main>
    )
}
