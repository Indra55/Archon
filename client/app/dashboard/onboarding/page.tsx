'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Compass, Loader2, Sparkles, ChevronRight, Clock,
    BookOpen, Code2, Server, Shield, Layers,
    Trash2, BarChart3
} from 'lucide-react'

interface LearningPath {
    id: string
    role: string
    title: string
    description: string
    modules: Module[]
    status: string
    progress_pct: number
    created_at: string
    estimated_total_minutes?: number
}

interface Module {
    id: string
    title: string
    description: string
    type: string
    estimated_minutes: number
    completed?: boolean
}

interface Role {
    value: string
    label: string
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
    backend_engineer: <Server size={20} />,
    frontend_developer: <Code2 size={20} />,
    sre: <Shield size={20} />,
    fullstack_engineer: <Layers size={20} />,
    devops_engineer: <BarChart3 size={20} />,
}

const ROLE_COLORS: Record<string, string> = {
    backend_engineer: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30',
    frontend_developer: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30',
    sre: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
    fullstack_engineer: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30',
    devops_engineer: 'from-rose-500/20 to-pink-500/10 border-rose-500/30',
}

const ROLE_ACCENT: Record<string, string> = {
    backend_engineer: 'text-indigo-400',
    frontend_developer: 'text-cyan-400',
    sre: 'text-amber-400',
    fullstack_engineer: 'text-emerald-400',
    devops_engineer: 'text-rose-400',
}

export default function OnboardingPage() {
    const router = useRouter()
    const [paths, setPaths] = useState<LearningPath[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [selectedRole, setSelectedRole] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        fetchPaths()
        fetchRoles()
    }, [])

    const fetchPaths = async () => {
        try {
            const res = await fetch('/api/onboarding')
            if (res.ok) {
                const data = await res.json()
                setPaths(data.paths || [])
            }
        } catch (err) {
            console.error('Failed to fetch paths:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchRoles = async () => {
        try {
            const res = await fetch('/api/onboarding/roles')
            if (res.ok) {
                const data = await res.json()
                setRoles(data)
                if (data.length > 0 && !selectedRole) {
                    setSelectedRole(data[0].value)
                }
            }
        } catch {
            // Fallback roles
            setRoles([
                { value: 'backend_engineer', label: 'Backend Engineer' },
                { value: 'frontend_developer', label: 'Frontend Developer' },
                { value: 'sre', label: 'SRE' },
                { value: 'fullstack_engineer', label: 'Fullstack Engineer' },
                { value: 'devops_engineer', label: 'DevOps Engineer' },
            ])
            setSelectedRole('backend_engineer')
        }
    }

    const handleGenerate = async () => {
        if (!selectedRole || generating) return
        setGenerating(true)

        try {
            const res = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: selectedRole }),
            })

            if (res.ok) {
                const data = await res.json()
                if (data.learning_path) {
                    setPaths(prev => [data.learning_path, ...prev])
                }
            }
        } catch (err) {
            console.error('Failed to generate path:', err)
        } finally {
            setGenerating(false)
        }
    }

    const handleDelete = async (pathId: string) => {
        setDeletingId(pathId)
        try {
            const res = await fetch(`/api/onboarding/${pathId}`, { method: 'DELETE' })
            if (res.ok) {
                setPaths(prev => prev.filter(p => p.id !== pathId))
            }
        } catch (err) {
            console.error('Failed to delete path:', err)
        } finally {
            setDeletingId(null)
        }
    }

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)
        if (diffMins < 1) return 'just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 30) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    return (
        <div className="w-full h-full bg-base px-8 pt-8 pb-16 overflow-y-auto scrollbar-none">
            <div className="max-w-[1200px] mx-auto w-full">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                            <Compass className="w-5 h-5 text-accent" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground font-[var(--font-plex-sans)]">
                            Onboarding Paths
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono ml-12">
                        Personalized learning paths powered by your codebase&apos;s knowledge graph
                    </p>
                </motion.div>

                {/* Generate Section */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="mb-8 p-6 rounded-xl border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent"
                >
                    <h2 className="text-lg font-bold text-foreground mb-1 font-[var(--font-plex-sans)]">
                        Generate a Learning Path
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono mb-5">
                        Select a role and we&apos;ll create a personalized onboarding journey using AI + your knowledge graph
                    </p>

                    {/* Role Selector */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
                        {roles.map((role) => (
                            <button
                                key={role.value}
                                onClick={() => setSelectedRole(role.value)}
                                className={`relative group p-4 rounded-lg border transition-all duration-200 text-left ${selectedRole === role.value
                                        ? `bg-gradient-to-br ${ROLE_COLORS[role.value] || 'from-accent/20 to-accent/5 border-accent/40'} shadow-lg shadow-accent/5`
                                        : 'border-border/50 bg-card/30 hover:border-accent/30 hover:bg-card/50'
                                    }`}
                            >
                                <div className={`mb-2 ${selectedRole === role.value ? (ROLE_ACCENT[role.value] || 'text-accent') : 'text-muted-foreground'}`}>
                                    {ROLE_ICONS[role.value] || <Compass size={20} />}
                                </div>
                                <span className={`text-xs font-bold font-mono ${selectedRole === role.value ? 'text-foreground' : 'text-muted-foreground'
                                    }`}>
                                    {role.label}
                                </span>
                                {selectedRole === role.value && (
                                    <motion.div
                                        layoutId="role-indicator"
                                        className="absolute -top-px -right-px w-2 h-2 rounded-full bg-accent"
                                        transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={generating || !selectedRole}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm bg-accent text-background font-bold hover:bg-accent/90 transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {generating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Generating with AI...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                                Generate Learning Path
                            </>
                        )}
                    </button>

                    {generating && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 p-4 rounded-lg border border-accent/20 bg-accent/5"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                                    <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-accent/20 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">Analyzing your knowledge graph...</p>
                                    <p className="text-xs text-muted-foreground font-mono">Querying relevant services, code patterns, and architecture decisions</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Existing Paths */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <BookOpen className="w-5 h-5 text-accent" />
                        <h2 className="text-lg font-bold text-foreground font-[var(--font-plex-sans)]">
                            Your Learning Paths
                        </h2>
                        {paths.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent font-mono border border-accent/30">
                                {paths.length}
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-5 h-5 text-accent animate-spin" />
                        </div>
                    ) : paths.length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-accent/20 rounded-xl">
                            <Compass className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                            <p className="text-sm text-muted-foreground font-mono mb-1">
                                No learning paths yet
                            </p>
                            <p className="text-xs text-muted-foreground/60 font-mono">
                                Select a role above and generate your first personalized path
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AnimatePresence>
                                {paths.map((path, idx) => (
                                    <motion.div
                                        key={path.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                                        onClick={() => router.push(`/dashboard/onboarding/${path.id}`)}
                                        className={`group relative p-5 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-accent/5 bg-gradient-to-br ${ROLE_COLORS[path.role] || 'from-accent/10 to-transparent border-accent/20'
                                            } hover:border-accent/50`}
                                    >
                                        {/* Top row */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`${ROLE_ACCENT[path.role] || 'text-accent'}`}>
                                                    {ROLE_ICONS[path.role] || <Compass size={18} />}
                                                </div>
                                                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-card/50 border border-border/50">
                                                    {path.role?.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${path.status === 'completed'
                                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                        : 'bg-accent/10 text-accent border border-accent/20'
                                                    }`}>
                                                    {path.status}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(path.id) }}
                                                    disabled={deletingId === path.id}
                                                    className="p-1 rounded text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    {deletingId === path.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-sm font-bold text-foreground mb-1 font-[var(--font-plex-sans)] line-clamp-1">
                                            {path.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-mono line-clamp-2 mb-4">
                                            {path.description}
                                        </p>

                                        {/* Progress bar */}
                                        <div className="mb-3">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-mono text-muted-foreground">Progress</span>
                                                <span className="text-[10px] font-mono text-accent font-bold">{path.progress_pct || 0}%</span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full bg-gradient-to-r from-accent to-purple-400"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${path.progress_pct || 0}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                />
                                            </div>
                                        </div>

                                        {/* Meta */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-mono">
                                                    <BookOpen size={10} />
                                                    {(path.modules || []).length} modules
                                                </span>
                                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-mono">
                                                    <Clock size={10} />
                                                    {formatTimeAgo(path.created_at)}
                                                </span>
                                            </div>
                                            <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-accent transition-colors" />
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
