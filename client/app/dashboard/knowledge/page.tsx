'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import {
    Database, MessageSquare, Github, RefreshCw, CheckCircle2,
    AlertTriangle, Loader2, Save, Plug, Clock, FileText, Hash,
    ExternalLink
} from 'lucide-react'

interface KnowledgeSource {
    id: string
    source_type: 'slack' | 'github'
    config: Record<string, any>
    last_synced_at: string | null
    status: string
    documents_ingested_count: number
    sync_error: string | null
}

export default function KnowledgeSourcesPage() {
    const { user, loading: authLoading, isAdmin } = useAuth()
    const router = useRouter()
    const [sources, setSources] = useState<KnowledgeSource[]>([])
    const [loading, setLoading] = useState(true)

    // Slack form
    const [slackToken, setSlackToken] = useState('')
    const [slackChannels, setSlackChannels] = useState('')
    const [slackSaving, setSlackSaving] = useState(false)
    const [slackTesting, setSlackTesting] = useState(false)
    const [slackSyncing, setSlackSyncing] = useState(false)
    const [slackMsg, setSlackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // GitHub form
    const [ghRepos, setGhRepos] = useState('')
    const [ghAllMarkdown, setGhAllMarkdown] = useState(false)
    const [ghSaving, setGhSaving] = useState(false)
    const [ghSyncing, setGhSyncing] = useState(false)
    const [ghMsg, setGhMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.replace('/dashboard')
        }
    }, [authLoading, isAdmin, router])

    useEffect(() => {
        fetchSources()
    }, [])

    const fetchSources = async () => {
        try {
            const res = await fetch('/api/knowledge/sources')
            if (res.ok) {
                const data = await res.json()
                setSources(data.sources || [])

                // Populate forms from existing sources
                const slack = data.sources?.find((s: KnowledgeSource) => s.source_type === 'slack')
                if (slack) {
                    setSlackChannels((slack.config?.channels || []).join(', '))
                }

                const gh = data.sources?.find((s: KnowledgeSource) => s.source_type === 'github')
                if (gh) {
                    setGhRepos((gh.config?.repos || []).join(', '))
                    setGhAllMarkdown(gh.config?.include_all_markdown || false)
                }
            }
        } catch (e) {
            console.error('Failed to fetch sources:', e)
        } finally {
            setLoading(false)
        }
    }

    const getSource = (type: string) => sources.find(s => s.source_type === type)

    // ── Slack handlers ──
    const handleSlackSave = async () => {
        setSlackSaving(true)
        setSlackMsg(null)
        try {
            const channels = slackChannels.split(',').map(c => c.trim()).filter(Boolean)
            const res = await fetch('/api/knowledge/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_type: 'slack',
                    config: {
                        token: slackToken || undefined,
                        channels,
                    },
                }),
            })
            if (res.ok) {
                setSlackMsg({ type: 'success', text: 'Slack connector saved!' })
                await fetchSources()
            } else {
                const data = await res.json()
                setSlackMsg({ type: 'error', text: data.error || 'Failed to save' })
            }
        } catch (e) {
            setSlackMsg({ type: 'error', text: 'Failed to save Slack config' })
        } finally {
            setSlackSaving(false)
        }
    }

    const handleSlackTest = async () => {
        const source = getSource('slack')
        if (!source) {
            setSlackMsg({ type: 'error', text: 'Save configuration first' })
            return
        }
        setSlackTesting(true)
        setSlackMsg(null)
        try {
            const res = await fetch(`/api/knowledge/sources/${source.id}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: slackToken || undefined }),
            })
            const data = await res.json()
            if (data.success) {
                setSlackMsg({ type: 'success', text: `Connected to workspace: ${data.team}` })
                await fetchSources()
            } else {
                setSlackMsg({ type: 'error', text: `Connection failed: ${data.error}` })
            }
        } catch (e) {
            setSlackMsg({ type: 'error', text: 'Failed to test connection' })
        } finally {
            setSlackTesting(false)
        }
    }

    const handleSlackSync = async () => {
        const source = getSource('slack')
        if (!source) return
        setSlackSyncing(true)
        setSlackMsg(null)
        try {
            const res = await fetch(`/api/knowledge/sources/${source.id}/sync`, { method: 'POST' })
            const data = await res.json()
            if (data.success) {
                setSlackMsg({ type: 'success', text: `Synced ${data.documents_ingested} messages` })
                await fetchSources()
            } else {
                setSlackMsg({ type: 'error', text: data.error || 'Sync failed' })
            }
        } catch (e) {
            setSlackMsg({ type: 'error', text: 'Sync failed' })
        } finally {
            setSlackSyncing(false)
        }
    }

    // ── GitHub handlers ──
    const handleGhSave = async () => {
        setGhSaving(true)
        setGhMsg(null)
        try {
            const repos = ghRepos.split(',').map(r => r.trim()).filter(Boolean)
            const res = await fetch('/api/knowledge/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_type: 'github',
                    config: {
                        repos,
                        include_all_markdown: ghAllMarkdown,
                    },
                }),
            })
            if (res.ok) {
                setGhMsg({ type: 'success', text: 'GitHub connector saved!' })
                await fetchSources()
            } else {
                const data = await res.json()
                setGhMsg({ type: 'error', text: data.error || 'Failed to save' })
            }
        } catch (e) {
            setGhMsg({ type: 'error', text: 'Failed to save GitHub config' })
        } finally {
            setGhSaving(false)
        }
    }

    const handleGhSync = async () => {
        const source = getSource('github')
        if (!source) {
            setGhMsg({ type: 'error', text: 'Save configuration first' })
            return
        }
        setGhSyncing(true)
        setGhMsg(null)
        try {
            const res = await fetch(`/api/knowledge/sources/${source.id}/sync`, { method: 'POST' })
            const data = await res.json()
            if (data.success) {
                setGhMsg({ type: 'success', text: `Synced ${data.documents_ingested} files from ${data.repos_scanned} repos` })
                await fetchSources()
            } else {
                setGhMsg({ type: 'error', text: data.error || 'Sync failed' })
            }
        } catch (e) {
            setGhMsg({ type: 'error', text: 'Sync failed' })
        } finally {
            setGhSyncing(false)
        }
    }

    const formatDate = (d: string | null) => {
        if (!d) return 'Never'
        return new Date(d).toLocaleString()
    }

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            connected: 'bg-green/10 text-green border-green/20',
            error: 'bg-red/10 text-red border-red/20',
            never_synced: 'bg-muted/10 text-muted border-dim',
        }
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${colors[status] || colors.never_synced}`}>
                {status === 'connected' && <CheckCircle2 className="w-3 h-3" />}
                {status === 'error' && <AlertTriangle className="w-3 h-3" />}
                {status.replace('_', ' ')}
            </span>
        )
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col overflow-y-auto scrollbar-none">
            <div className="flex-1 px-4 md:px-8 pt-8 pb-16">
                <div className="max-w-[900px] mx-auto w-full">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 mb-8"
                    >
                        <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/30">
                            <Database className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-primary font-sans">Knowledge Sources</h1>
                            <p className="text-xs text-muted font-mono">Configure connectors to ingest engineering knowledge</p>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* ── SLACK CONNECTOR ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="border border-dim rounded-xl bg-surface/60 backdrop-blur-sm overflow-hidden"
                        >
                            <div className="px-5 py-4 border-b border-dim flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 rounded-lg bg-purple/10">
                                        <MessageSquare className="w-4 h-4 text-purple" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-primary font-sans">Slack</h3>
                                        <p className="text-[10px] text-muted font-mono">Ingest channel messages</p>
                                    </div>
                                </div>
                                {getSource('slack') && <StatusBadge status={getSource('slack')!.status} />}
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono uppercase tracking-wider text-secondary">Bot Token</label>
                                    <input
                                        id="slack-token-input"
                                        type="password"
                                        value={slackToken}
                                        onChange={e => setSlackToken(e.target.value)}
                                        placeholder="xoxb-..."
                                        className="w-full px-3 py-2.5 bg-elevated border border-dim rounded-lg font-mono text-xs text-primary placeholder:text-muted/40 focus:border-accent focus:outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono uppercase tracking-wider text-secondary">Channels</label>
                                    <input
                                        id="slack-channels-input"
                                        type="text"
                                        value={slackChannels}
                                        onChange={e => setSlackChannels(e.target.value)}
                                        placeholder="engineering-standards, platform, architecture"
                                        className="w-full px-3 py-2.5 bg-elevated border border-dim rounded-lg font-mono text-xs text-primary placeholder:text-muted/40 focus:border-accent focus:outline-none transition-all"
                                    />
                                    <p className="text-[9px] font-mono text-muted/60">Comma-separated channel names</p>
                                </div>

                                {/* Status info */}
                                {getSource('slack') && (
                                    <div className="flex items-center gap-4 text-[10px] font-mono text-muted">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(getSource('slack')!.last_synced_at)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Hash className="w-3 h-3" />
                                            {getSource('slack')!.documents_ingested_count} messages
                                        </span>
                                    </div>
                                )}

                                {slackMsg && (
                                    <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-mono ${slackMsg.type === 'success' ? 'bg-green/10 text-green border border-green/20' : 'bg-red/10 text-red border border-red/20'}`}>
                                        {slackMsg.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                        {slackMsg.text}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button onClick={handleSlackTest} disabled={slackTesting} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-mono bg-elevated border border-dim hover:border-accent/40 text-secondary transition-all disabled:opacity-50">
                                        {slackTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plug className="w-3 h-3" />}
                                        Test
                                    </button>
                                    <button onClick={handleSlackSave} disabled={slackSaving} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-mono bg-elevated border border-dim hover:border-accent/40 text-secondary transition-all disabled:opacity-50">
                                        {slackSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        Save
                                    </button>
                                    <button onClick={handleSlackSync} disabled={slackSyncing || !getSource('slack')} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-mono font-bold bg-accent text-base hover:bg-accent/90 transition-all disabled:opacity-50">
                                        {slackSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                        Sync
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* ── GITHUB CONNECTOR ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="border border-dim rounded-xl bg-surface/60 backdrop-blur-sm overflow-hidden"
                        >
                            <div className="px-5 py-4 border-b border-dim flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 rounded-lg bg-accent/10">
                                        <Github className="w-4 h-4 text-accent" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-primary font-sans">GitHub</h3>
                                        <p className="text-[10px] text-muted font-mono">READMEs & markdown files</p>
                                    </div>
                                </div>
                                {getSource('github') && <StatusBadge status={getSource('github')!.status} />}
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/5 border border-accent/10">
                                    <CheckCircle2 className="w-3 h-3 text-accent shrink-0" />
                                    <p className="text-[10px] font-mono text-accent/80">
                                        Uses org token from setup — no extra token needed
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono uppercase tracking-wider text-secondary">Specific Repos (optional)</label>
                                    <input
                                        id="github-repos-input"
                                        type="text"
                                        value={ghRepos}
                                        onChange={e => setGhRepos(e.target.value)}
                                        placeholder="Leave blank to scan all org repos"
                                        className="w-full px-3 py-2.5 bg-elevated border border-dim rounded-lg font-mono text-xs text-primary placeholder:text-muted/40 focus:border-accent focus:outline-none transition-all"
                                    />
                                    <p className="text-[9px] font-mono text-muted/60">Comma-separated repo names (without org prefix)</p>
                                </div>

                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        id="github-all-md-checkbox"
                                        type="checkbox"
                                        checked={ghAllMarkdown}
                                        onChange={e => setGhAllMarkdown(e.target.checked)}
                                        className="w-4 h-4 rounded border-dim bg-elevated accent-accent"
                                    />
                                    <div>
                                        <span className="text-xs font-mono text-secondary group-hover:text-primary transition-colors">Include all markdown files</span>
                                        <p className="text-[9px] font-mono text-muted/60">Otherwise only READMEs are ingested</p>
                                    </div>
                                </label>

                                {/* Status info */}
                                {getSource('github') && (
                                    <div className="flex items-center gap-4 text-[10px] font-mono text-muted">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(getSource('github')!.last_synced_at)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            {getSource('github')!.documents_ingested_count} files
                                        </span>
                                    </div>
                                )}

                                {ghMsg && (
                                    <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-mono ${ghMsg.type === 'success' ? 'bg-green/10 text-green border border-green/20' : 'bg-red/10 text-red border border-red/20'}`}>
                                        {ghMsg.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                        {ghMsg.text}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button onClick={handleGhSave} disabled={ghSaving} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-mono bg-elevated border border-dim hover:border-accent/40 text-secondary transition-all disabled:opacity-50">
                                        {ghSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        Save Config
                                    </button>
                                    <button onClick={handleGhSync} disabled={ghSyncing || !getSource('github')} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-mono font-bold bg-accent text-base hover:bg-accent/90 transition-all disabled:opacity-50">
                                        {ghSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                        Sync Now
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}
