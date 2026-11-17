'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Github, Loader2, AlertTriangle, ShieldAlert, UserX
} from 'lucide-react'
import { getGithubAuthUrl } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [orgName, setOrgName] = useState<string | null>(null)
  const [orgConfigured, setOrgConfigured] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

        // Check org status
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

    // Extract error from URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const err = params.get('error')
      if (err) setError(err)
    }
  }, [router])

  const errorMessages: Record<string, { icon: typeof AlertTriangle; message: string }> = {
    not_org_member: {
      icon: ShieldAlert,
      message: `You do not have access to the connected GitHub repository for ${orgName || 'this workspace'}. Contact your admin.`,
    },
    account_deactivated: {
      icon: UserX,
      message: 'Your account has been deactivated. Contact your admin.',
    },
    github_auth_failed: {
      icon: AlertTriangle,
      message: 'GitHub authentication failed. Please try again.',
    },
  }

  const errorInfo = error
    ? (errorMessages[error] || { icon: AlertTriangle, message: 'An error occurred. Please try again.' })
    : null

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
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Wordmark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 border border-accent/30 mb-4">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-3xl font-bold text-primary font-sans tracking-tight">
            Archon
          </h1>
          <p className="text-sm text-muted mt-1 font-mono">
            AI Engineering Intelligence Platform
          </p>
          {orgName && (
            <span className="inline-block mt-2 text-[10px] font-mono text-accent/70 bg-accent/5 border border-accent/10 px-2.5 py-0.5 rounded-full">
              {orgName}
            </span>
          )}
        </div>

        {/* Card */}
        <div className="border border-dim rounded-xl bg-surface/80 backdrop-blur-sm p-8 space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-primary font-sans">Welcome back</h2>
            <p className="text-xs text-muted font-mono">
              Sign in with your{orgName ? ` ${orgName}` : ''} GitHub account
            </p>
          </div>

          {/* Error */}
          {errorInfo && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red/10 border border-red/20"
            >
              <errorInfo.icon className="w-4 h-4 text-red shrink-0 mt-0.5" />
              <p className="text-xs font-mono text-red leading-relaxed">{errorInfo.message}</p>
            </motion.div>
          )}

          {/* Org not configured warning */}
          {orgConfigured === false && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-amber/10 border border-amber/20">
              <AlertTriangle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
              <p className="text-xs font-mono text-amber leading-relaxed">
                No organization configured yet.{' '}
                <Link href="/signup" className="underline">
                  Set up as admin →
                </Link>
              </p>
            </div>
          )}

          {/* GitHub Login */}
          <a href={getGithubAuthUrl()} id="github-login-btn" className="block">
            <button className="w-full flex items-center justify-center gap-3 py-3 rounded-lg font-mono text-sm font-bold bg-primary text-base hover:bg-primary/90 transition-all">
              <Github className="w-5 h-5" />
              Login with GitHub
            </button>
          </a>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dim" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-surface/80 text-[10px] font-mono text-muted uppercase tracking-wider">
                new to Archon?
              </span>
            </div>
          </div>

          <Link href="/signup" id="goto-signup-btn" className="block">
            <button className="w-full py-2.5 rounded-lg font-mono text-sm border border-dim hover:border-accent/40 text-secondary hover:text-primary transition-all">
              Create an account
            </button>
          </Link>
        </div>

        <p className="text-center text-[10px] font-mono text-muted/40 mt-6">
          Archon · AI Engineering Intelligence Platform
        </p>
      </motion.div>
    </main>
  )
}
