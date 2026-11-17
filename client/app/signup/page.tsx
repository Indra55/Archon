'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Github, Loader2, Code2, Shield, Building2, ArrowRight, CheckCircle2, KeyRound, X
} from 'lucide-react'
import { getGithubAuthUrl } from '@/lib/auth'

type Role = 'dev' | 'admin' | null

export default function SignupPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Role>(null)
  const [orgName, setOrgName] = useState<string | null>(null)
  const [orgConfigured, setOrgConfigured] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  // Join code state
  const [joinCode, setJoinCode] = useState('')
  const [codeValid, setCodeValid] = useState<boolean | null>(null)
  const [codeOrgName, setCodeOrgName] = useState<string | null>(null)
  const [validatingCode, setValidatingCode] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        // Redirect if already logged in
        const sessionRes = await fetch('/api/auth/session')
        const sessionData = await sessionRes.json()
        if (sessionData.user) {
          router.replace('/dashboard')
          return
        }

        // Fetch org status
        const orgRes = await fetch('/api/org/status')
        const orgData = await orgRes.json()
        setOrgConfigured(orgData.configured)
        if (orgData.configured) {
          setOrgName(orgData.org?.org_name || null)
        }
      } catch (e) {
        // continue
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  // Format join code input (auto-uppercase, auto-dash)
  const handleCodeInput = (raw: string) => {
    // Strip non-alphanumeric except dash
    let cleaned = raw.toUpperCase().replace(/[^A-Z0-9-]/g, '')
    // Auto-insert dash after 3 letters if user didnt type it
    if (cleaned.length === 4 && !cleaned.includes('-')) {
      cleaned = cleaned.slice(0, 3) + '-' + cleaned.slice(3)
    }
    // Limit to 8 chars (ABC-1234)
    setJoinCode(cleaned.slice(0, 8))
    setCodeValid(null)
    setCodeError(null)
    setCodeOrgName(null)
  }

  const validateJoinCode = async () => {
    if (joinCode.length < 8) return
    setValidatingCode(true)
    setCodeError(null)
    try {
      const res = await fetch('/api/org/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ join_code: joinCode }),
      })
      const data = await res.json()
      if (data.valid) {
        setCodeValid(true)
        setCodeOrgName(data.org_name)
      } else {
        setCodeValid(false)
        setCodeError(data.error || 'Invalid code')
      }
    } catch {
      setCodeValid(false)
      setCodeError('Failed to validate code')
    } finally {
      setValidatingCode(false)
    }
  }

  const handleContinue = () => {
    if (selected === 'admin') {
      if (!orgConfigured) {
        router.push('/setup')
      } else {
        window.location.href = getGithubAuthUrl()
      }
    } else if (selected === 'dev' && codeValid) {
      // Dev: validated join code → proceed to GitHub OAuth with code
      window.location.href = getGithubAuthUrl(joinCode)
    }
  }

  // Determine if CTA is available
  const canContinue = selected !== null && (
    selected === 'admin' || // admin always can continue
    (selected === 'dev' && codeValid === true) // dev only if join code validated
  )

  const devNeedsCode = selected === 'dev'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-base relative overflow-hidden">
      <div className="grid-bg fixed inset-0 opacity-20" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />

      <motion.div
        className="w-full max-w-lg relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Wordmark */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 border border-accent/30 mb-4">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-3xl font-bold text-primary font-sans tracking-tight">
            Archon
          </h1>
          <p className="text-sm text-muted mt-1 font-mono">
            AI Engineering Intelligence Platform
          </p>
        </div>

        {/* Heading */}
        <div className="space-y-1 mb-6">
          <h2 className="text-xl font-bold text-primary font-sans">Create an account</h2>
          <p className="text-xs text-muted font-mono">How will you be using Archon?</p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Developer */}
          <motion.button
            id="signup-dev-card"
            onClick={() => setSelected('dev')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative text-left p-5 rounded-xl border transition-all ${selected === 'dev'
              ? 'border-accent bg-accent/5 shadow-[0_0_0_1px_rgba(var(--accent-rgb),0.2)]'
              : 'border-dim bg-surface/60 hover:border-accent/30 hover:bg-surface/80'
              }`}
          >
            {selected === 'dev' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3"
              >
                <CheckCircle2 className="w-4 h-4 text-accent" />
              </motion.div>
            )}
            <div className={`inline-flex p-2.5 rounded-lg mb-3 ${selected === 'dev' ? 'bg-accent/10' : 'bg-elevated'}`}>
              <Code2 className={`w-5 h-5 ${selected === 'dev' ? 'text-accent' : 'text-muted'}`} />
            </div>
            <h3 className="text-sm font-bold text-primary font-sans">Developer</h3>
            <p className="text-[10px] text-muted font-mono mt-1 leading-relaxed">
              Join my team's existing workspace
            </p>
            {orgName && (
              <span className="inline-block mt-2 text-[9px] font-mono text-accent/60 bg-accent/5 border border-accent/10 px-1.5 py-0.5 rounded-full">
                {orgName}
              </span>
            )}
          </motion.button>

          {/* Admin */}
          <motion.button
            id="signup-admin-card"
            onClick={() => setSelected('admin')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative text-left p-5 rounded-xl border transition-all ${selected === 'admin'
              ? 'border-amber bg-amber/5 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]'
              : 'border-dim bg-surface/60 hover:border-amber/30 hover:bg-surface/80'
              }`}
          >
            {selected === 'admin' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3"
              >
                <CheckCircle2 className="w-4 h-4 text-amber" />
              </motion.div>
            )}
            <div className={`inline-flex p-2.5 rounded-lg mb-3 ${selected === 'admin' ? 'bg-amber/10' : 'bg-elevated'}`}>
              <Shield className={`w-5 h-5 ${selected === 'admin' ? 'text-amber' : 'text-muted'}`} />
            </div>
            <h3 className="text-sm font-bold text-primary font-sans">Admin</h3>
            <p className="text-[10px] text-muted font-mono mt-1 leading-relaxed">
              {orgConfigured
                ? 'Manage my workspace'
                : "Set up my team's workspace"}
            </p>
          </motion.button>
        </div>

        {/* Join Code Input — shown when dev is selected */}
        {devNeedsCode && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 space-y-3"
          >
            <div className="p-3.5 rounded-lg text-xs font-mono leading-relaxed bg-accent/5 border border-accent/10 text-muted">
              Enter the join code shared by your admin to get started.
            </div>

            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                id="join-code-input"
                type="text"
                value={joinCode}
                onChange={(e) => handleCodeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && joinCode.length === 8) validateJoinCode() }}
                placeholder="ABC-1234"
                maxLength={8}
                className="w-full pl-10 pr-24 py-3 bg-elevated border border-dim rounded-lg font-mono text-sm text-primary placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all tracking-[0.2em] uppercase"
              />
              <button
                id="validate-code-btn"
                onClick={validateJoinCode}
                disabled={joinCode.length < 8 || validatingCode}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md text-[10px] font-mono font-bold bg-accent text-base hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {validatingCode ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Verify'}
              </button>
            </div>

            {/* Validation result */}
            {codeValid === true && codeOrgName && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-green/10 border border-green/20"
              >
                <CheckCircle2 className="w-4 h-4 text-green shrink-0" />
                <p className="text-xs font-mono text-green">
                  Valid! You're joining <span className="font-bold">{codeOrgName}</span>
                </p>
              </motion.div>
            )}

            {codeValid === false && codeError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red/10 border border-red/20"
              >
                <X className="w-3.5 h-3.5 text-red shrink-0" />
                <p className="text-xs font-mono text-red">{codeError}. Check with your admin.</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {selected === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-lg text-xs font-mono text-muted leading-relaxed bg-amber/5 border border-amber/10"
          >
            {orgConfigured ? (
              <>
                You'll sign in with your GitHub account. Your admin role is already configured for <span className="text-amber">{orgName}</span>.
              </>
            ) : (
              <>
                You'll connect your GitHub repository, then sign in with GitHub.
                Developers can join after this one-time setup.
              </>
            )}
          </motion.div>
        )}

        {/* CTA */}
        <motion.button
          id="signup-continue-btn"
          onClick={handleContinue}
          disabled={!canContinue}
          whileHover={canContinue ? { scale: 1.01 } : {}}
          whileTap={canContinue ? { scale: 0.99 } : {}}
          className={`w-full flex items-center justify-center gap-3 py-3 rounded-lg font-mono text-sm font-bold transition-all ${!canContinue
            ? 'bg-elevated border border-dim text-muted/40 cursor-not-allowed'
            : selected === 'admin'
              ? 'bg-amber text-base hover:bg-amber/90'
              : 'bg-accent text-base hover:bg-accent/90'
            }`}
        >
          {!selected ? (
            'Select a role to continue'
          ) : selected === 'dev' && codeValid ? (
            <>
              <Github className="w-5 h-5" />
              Sign up with GitHub
              <ArrowRight className="w-4 h-4" />
            </>
          ) : selected === 'dev' ? (
            'Enter your join code above'
          ) : selected === 'admin' && orgConfigured ? (
            <>
              <Github className="w-5 h-5" />
              Sign in as Admin
              <ArrowRight className="w-4 h-4" />
            </>
          ) : selected === 'admin' ? (
            <>
              <Building2 className="w-5 h-5" />
              Set up Workspace
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            'Select a role to continue'
          )}
        </motion.button>

        {/* Already have account */}
        <p className="text-center text-xs font-mono text-muted mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:text-accent/80 transition-colors">
            Sign in →
          </Link>
        </p>

        <p className="text-center text-[10px] font-mono text-muted/40 mt-4">
          Archon · AI Engineering Intelligence Platform
        </p>
      </motion.div>
    </main>
  )
}
