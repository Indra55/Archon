'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft, Loader2, CheckCircle2, Circle, Clock,
    BookOpen, Code2, Server, Shield, Layers, Lightbulb,
    ChevronDown, ChevronUp, Zap, Target, Eye, EyeOff,
    Compass, BarChart3, Youtube
} from 'lucide-react'

interface LearningPath {
    id: string
    role: string
    title: string
    description: string
    modules: Module[]
    status: string
    progress_pct: number
    estimated_total_minutes?: number
}

interface Module {
    id: string
    title: string
    description: string
    type: string
    estimated_minutes: number
    content?: string
    key_takeaways?: string[]
    recommended_videos?: { title: string; youtube_id?: string; search_query?: string }[]
    linked_graph_nodes?: string[]
    completed?: boolean
}

interface StarterTask {
    id: string
    title: string
    description: string
    difficulty: string
    linked_nodes: string[]
    hints: string[]
    status: string
    learning_objectives?: string[]
}

const MODULE_TYPE_ICONS: Record<string, React.ReactNode> = {
    architecture: <Layers size={16} />,
    service: <Server size={16} />,
    code: <Code2 size={16} />,
    decision: <Lightbulb size={16} />,
    operations: <Shield size={16} />,
}

const MODULE_TYPE_COLORS: Record<string, string> = {
    architecture: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    service: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    code: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    decision: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    operations: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
}

const DIFFICULTY_COLORS: Record<string, string> = {
    easy: 'bg-green-500/10 text-green-400 border-green-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    hard: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
    backend_engineer: <Server size={18} />,
    frontend_developer: <Code2 size={18} />,
    sre: <Shield size={18} />,
    fullstack_engineer: <Layers size={18} />,
    devops_engineer: <BarChart3 size={18} />,
}

export default function LearningPathDetailPage({ params }: { params: Promise<{ pathId: string }> }) {
    const { pathId } = use(params)
    const router = useRouter()
    const [path, setPath] = useState<LearningPath | null>(null)
    const [tasks, setTasks] = useState<StarterTask[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedModule, setExpandedModule] = useState<string | null>(null)
    const [showHints, setShowHints] = useState<Record<string, boolean>>({})
    const [updatingModule, setUpdatingModule] = useState<string | null>(null)

    useEffect(() => {
        fetchPathDetail()
    }, [pathId])

    const fetchPathDetail = async () => {
        try {
            const res = await fetch(`/api/onboarding/${pathId}`)
            if (res.ok) {
                const data = await res.json()
                setPath(data.path || null)
                setTasks(data.tasks || [])
            }
        } catch (err) {
            console.error('Failed to fetch path detail:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleModule = async (moduleId: string, completed: boolean) => {
        if (!path) return
        setUpdatingModule(moduleId)

        try {
            const res = await fetch(`/api/onboarding/${pathId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ module_id: moduleId, completed }),
            })

            if (res.ok) {
                const data = await res.json()
                setPath(prev => prev ? {
                    ...prev,
                    modules: data.modules,
                    progress_pct: data.progress_pct,
                    status: data.status,
                } : null)
            }
        } catch (err) {
            console.error('Failed to update progress:', err)
        } finally {
            setUpdatingModule(null)
        }
    }

    const handleTaskStatusChange = async (taskId: string, status: string) => {
        try {
            // Use the backend endpoint directly for tasks
            const res = await fetch(`/api/onboarding/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            })
            if (res.ok) {
                setTasks(prev => prev.map(t =>
                    t.id === taskId ? { ...t, status } : t
                ))
            }
        } catch (err) {
            console.error('Failed to update task:', err)
        }
    }

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
        )
    }

    if (!path) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <p className="text-sm text-muted-foreground font-mono">Learning path not found</p>
                <button
                    onClick={() => router.push('/dashboard/onboarding')}
                    className="flex items-center gap-2 text-accent text-sm font-mono hover:underline"
                >
                    <ArrowLeft size={14} /> Back to paths
                </button>
            </div>
        )
    }

    const completedModules = (path.modules || []).filter(m => m.completed).length
    const totalModules = (path.modules || []).length

    return (
        <div className="w-full h-full bg-base px-8 pt-8 pb-16 overflow-y-auto scrollbar-none">
            <div className="max-w-[900px] mx-auto w-full">
                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => router.push('/dashboard/onboarding')}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors font-mono mb-6"
                >
                    <ArrowLeft size={14} /> Back to Onboarding Paths
                </motion.button>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="text-accent">
                            {ROLE_ICONS[path.role] || <Compass size={18} />}
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-card/50 border border-border/50">
                            {path.role?.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${path.status === 'completed'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-accent/10 text-accent border border-accent/20'
                            }`}>
                            {path.status}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground font-[var(--font-plex-sans)] mb-2">
                        {path.title}
                    </h1>
                    <p className="text-sm text-muted-foreground font-mono mb-4">
                        {path.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="p-4 rounded-xl border border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-mono text-muted-foreground">
                                {completedModules} of {totalModules} modules completed
                            </span>
                            <span className="text-sm font-mono text-accent font-bold">
                                {path.progress_pct || 0}%
                            </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-border/50 overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-accent via-purple-400 to-pink-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${path.progress_pct || 0}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Module Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-2 mb-5">
                        <BookOpen className="w-4 h-4 text-accent" />
                        <h2 className="text-lg font-bold text-foreground font-[var(--font-plex-sans)]">
                            Learning Modules
                        </h2>
                    </div>

                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border/50" />

                        <div className="space-y-3">
                            {(path.modules || []).map((module, idx) => {
                                const isExpanded = expandedModule === module.id
                                const typeStyle = MODULE_TYPE_COLORS[module.type] || 'text-accent bg-accent/10 border-accent/20'

                                return (
                                    <motion.div
                                        key={module.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                                        className="relative pl-12"
                                    >
                                        {/* Timeline dot */}
                                        <button
                                            onClick={() => handleToggleModule(module.id, !module.completed)}
                                            disabled={updatingModule === module.id}
                                            className="absolute left-0 top-4 z-10 transition-all hover:scale-110"
                                        >
                                            {updatingModule === module.id ? (
                                                <Loader2 size={18} className="text-accent animate-spin" />
                                            ) : module.completed ? (
                                                <CheckCircle2 size={18} className="text-green-400 fill-green-400/20" />
                                            ) : (
                                                <Circle size={18} className="text-muted-foreground/40 hover:text-accent" />
                                            )}
                                        </button>

                                        {/* Module Card */}
                                        <div
                                            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${module.completed
                                                ? 'border-green-500/20 bg-green-500/5'
                                                : 'border-border/50 bg-card/30 hover:border-accent/30'
                                                }`}
                                            onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${typeStyle}`}>
                                                            {MODULE_TYPE_ICONS[module.type]}
                                                            {module.type}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50 font-mono">
                                                            <Clock size={10} />
                                                            {module.estimated_minutes}min
                                                        </span>
                                                    </div>
                                                    <h3 className={`text-sm font-bold font-[var(--font-plex-sans)] ${module.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                                                        }`}>
                                                        {module.title}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground font-mono mt-1 line-clamp-2">
                                                        {module.description}
                                                    </p>
                                                </div>
                                                <div className="ml-3 mt-1">
                                                    {isExpanded ? (
                                                        <ChevronUp size={14} className="text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown size={14} className="text-muted-foreground" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expanded Content */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="mt-4 pt-4 border-t border-border/30">
                                                            {/* Content */}
                                                            {module.content && (
                                                                <div className="prose prose-invert prose-sm max-w-none mb-4">
                                                                    <div className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                                                                        {module.content}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Key Takeaways */}
                                                            {module.key_takeaways && module.key_takeaways.length > 0 && (
                                                                <div className="mt-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                                                                    <h4 className="text-[10px] font-mono text-accent font-bold uppercase tracking-wider mb-2">
                                                                        Key Takeaways
                                                                    </h4>
                                                                    <ul className="space-y-1">
                                                                        {module.key_takeaways.map((takeaway, i) => (
                                                                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground font-mono">
                                                                                <Target size={10} className="mt-0.5 text-accent shrink-0" />
                                                                                {takeaway}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}

                                                            {/* Recommended Videos (Embedded) */}
                                                            {module.recommended_videos && module.recommended_videos.length > 0 && (
                                                                <div className="mt-4 pt-3 border-t border-border/30">
                                                                    <h4 className="flex items-center gap-1.5 text-[10px] font-mono text-red-500 font-bold uppercase tracking-wider mb-3">
                                                                        <Youtube size={12} /> Recommended Videos
                                                                    </h4>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                        {module.recommended_videos.map((vid, i) => (
                                                                            <div key={i} className="flex flex-col gap-1.5">
                                                                                {vid.youtube_id ? (
                                                                                    <div className="relative w-full aspect-video rounded-md overflow-hidden border border-border/50 bg-black/50">
                                                                                        <iframe
                                                                                            src={`https://www.youtube.com/embed/${vid.youtube_id}`}
                                                                                            title={vid.title}
                                                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                                            allowFullScreen
                                                                                            className="absolute top-0 left-0 w-full h-full"
                                                                                        ></iframe>
                                                                                    </div>
                                                                                ) : (
                                                                                    <a
                                                                                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(vid.search_query || vid.title)}`}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="flex items-center justify-between p-3 rounded-md bg-card/60 hover:bg-red-500/10 border border-border/50 hover:border-red-500/30 transition-colors group aspect-video"
                                                                                    >
                                                                                        <span className="text-sm font-medium text-foreground group-hover:text-red-400 transition-colors text-center w-full px-4">
                                                                                            Search YouTube for:<br /><span className="text-xs text-muted-foreground mt-1 inline-block">{vid.title}</span>
                                                                                        </span>
                                                                                    </a>
                                                                                )}
                                                                                <p className="text-xs font-medium text-muted-foreground truncate px-1" title={vid.title}>
                                                                                    {vid.title}
                                                                                </p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Linked Nodes */}
                                                            {module.linked_graph_nodes && module.linked_graph_nodes.length > 0 && (
                                                                <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground/60 font-mono">
                                                                    <Zap size={10} />
                                                                    {module.linked_graph_nodes.length} knowledge graph nodes linked
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* Starter Tasks */}
                {tasks.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                    >
                        <div className="flex items-center gap-2 mb-5">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <h2 className="text-lg font-bold text-foreground font-[var(--font-plex-sans)]">
                                Starter Tasks
                            </h2>
                            <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                {tasks.filter(t => t.status === 'completed').length}/{tasks.length} done
                            </span>
                        </div>

                        <div className="space-y-3">
                            {tasks.map((task, idx) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.2 + idx * 0.05 }}
                                    className={`p-5 rounded-xl border transition-all ${task.status === 'completed'
                                        ? 'border-green-500/20 bg-green-500/5'
                                        : task.status === 'in_progress'
                                            ? 'border-amber-500/20 bg-amber-500/5'
                                            : 'border-border/50 bg-card/30'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${DIFFICULTY_COLORS[task.difficulty] || DIFFICULTY_COLORS.easy
                                                }`}>
                                                {task.difficulty}
                                            </span>
                                            {task.linked_nodes && task.linked_nodes.length > 0 && (
                                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50 font-mono">
                                                    <Zap size={10} /> {task.linked_nodes.length} nodes
                                                </span>
                                            )}
                                        </div>
                                        <select
                                            value={task.status}
                                            onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                                            className="text-[10px] font-mono bg-card/50 border border-border/50 rounded px-2 py-1 text-muted-foreground cursor-pointer focus:outline-none focus:border-accent/50"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>

                                    <h3 className={`text-sm font-bold font-[var(--font-plex-sans)] mb-1 ${task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'
                                        }`}>
                                        {task.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground font-mono mb-3">
                                        {task.description}
                                    </p>

                                    {/* Hints Toggle */}
                                    {task.hints && task.hints.length > 0 && (
                                        <div>
                                            <button
                                                onClick={() => setShowHints(prev => ({
                                                    ...prev,
                                                    [task.id]: !prev[task.id]
                                                }))}
                                                className="flex items-center gap-1.5 text-[10px] font-mono text-accent/70 hover:text-accent transition-colors"
                                            >
                                                {showHints[task.id] ? <EyeOff size={10} /> : <Eye size={10} />}
                                                {showHints[task.id] ? 'Hide hints' : `Show ${task.hints.length} hints`}
                                            </button>

                                            <AnimatePresence>
                                                {showHints[task.id] && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="mt-2 p-3 rounded-lg bg-accent/5 border border-accent/10">
                                                            <ul className="space-y-1.5">
                                                                {task.hints.map((hint, i) => (
                                                                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground font-mono">
                                                                        <Lightbulb size={10} className="mt-0.5 text-amber-400 shrink-0" />
                                                                        {hint}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
