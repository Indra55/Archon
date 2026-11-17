'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, UserPlus, Loader2, Shield, Eye, Code2,
    Copy, Check, AlertTriangle, X, ChevronDown, RefreshCw, KeyRound
} from 'lucide-react'

interface TeamUser {
    id: string
    username: string
    email: string
    github_username: string
    github_avatar_url: string
    kachow_role: string
    team: string | null
    is_active: boolean
    last_login_at: string | null
    created_at: string
}

interface OrgMember {
    github_id: number
    github_username: string
    github_avatar_url: string
}

export default function TeamManagementPage() {
    const { user, loading: authLoading, isAdmin } = useAuth()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active')
    const [users, setUsers] = useState<TeamUser[]>([])
    const [orgMembers, setOrgMembers] = useState<OrgMember[]>([])
    const [orgStats, setOrgStats] = useState({ total: 0, onboarded: 0 })
    const [loading, setLoading] = useState(true)
    const [loadingMembers, setLoadingMembers] = useState(false)
    const [deactivateModal, setDeactivateModal] = useState<TeamUser | null>(null)
    const [copied, setCopied] = useState(false)

    // Join code state
    const [joinCode, setJoinCode] = useState<string | null>(null)
    const [joinCodeOrgName, setJoinCodeOrgName] = useState<string | null>(null)
    const [copiedCode, setCopiedCode] = useState(false)
    const [regenerating, setRegenerating] = useState(false)

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.replace('/dashboard')
        }
    }, [authLoading, isAdmin, router])

    useEffect(() => {
        fetchUsers()
        fetchJoinCode()
    }, [])

    useEffect(() => {
        if (activeTab === 'pending') {
            fetchOrgMembers()
        }
    }, [activeTab])

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data.users || [])
            }
        } catch (e) {
            console.error('Failed to fetch users:', e)
        } finally {
            setLoading(false)
        }
    }

    const fetchOrgMembers = async () => {
        setLoadingMembers(true)
        try {
            const res = await fetch('/api/admin/org/members')
            if (res.ok) {
                const data = await res.json()
                setOrgMembers(data.not_onboarded || [])
                setOrgStats({ total: data.total_org_members, onboarded: data.onboarded })
            }
        } catch (e) {
            console.error('Failed to fetch org members:', e)
        } finally {
            setLoadingMembers(false)
        }
    }

    const fetchJoinCode = async () => {
        try {
            const res = await fetch('/api/org/join-code')
            if (res.ok) {
                const data = await res.json()
                setJoinCode(data.join_code)
                setJoinCodeOrgName(data.org_name)
            }
        } catch (e) {
            console.error('Failed to fetch join code:', e)
        }
    }

    const handleRegenerateCode = async () => {
        setRegenerating(true)
        try {
            const res = await fetch('/api/org/join-code/regenerate', { method: 'POST' })
            if (res.ok) {
                const data = await res.json()
                setJoinCode(data.join_code)
            }
        } catch (e) {
            console.error('Failed to regenerate code:', e)
        } finally {
            setRegenerating(false)
        }
    }

    const copyJoinCode = () => {
        if (!joinCode) return
        navigator.clipboard.writeText(joinCode)
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
    }

    const handleRoleChange = async (userId: string, role: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
            })
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, kachow_role: role } : u))
            }
        } catch (e) {
            console.error('Failed to update role:', e)
        }
    }

    const handleTeamChange = async (userId: string, team: string) => {
        try {
            await fetch(`/api/admin/users/${userId}/team`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team: team || null }),
            })
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, team: team || null } : u))
        } catch (e) {
            console.error('Failed to update team:', e)
        }
    }

    const handleDeactivate = async () => {
        if (!deactivateModal) return
        try {
            const res = await fetch(`/api/admin/users/${deactivateModal.id}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === deactivateModal.id ? { ...u, is_active: false } : u))
            }
        } catch (e) {
            console.error('Failed to deactivate user:', e)
        } finally {
            setDeactivateModal(null)
        }
    }

    const copyInviteLink = () => {
        const url = typeof window !== 'undefined' ? `${window.location.origin}/login` : ''
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const formatLastActive = (d: string | null) => {
        if (!d) return 'Never'
        const diff = Date.now() - new Date(d).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins}m ago`
        const hrs = Math.floor(diff / 3600000)
        if (hrs < 24) return `${hrs}h ago`
        const days = Math.floor(diff / 86400000)
        return `${days}d ago`
    }

    const roleIcon = (role: string) => {
        if (role === 'admin') return <Shield className="w-3 h-3 text-amber" />
        if (role === 'viewer') return <Eye className="w-3 h-3 text-muted" />
        return <Code2 className="w-3 h-3 text-accent" />
    }

    const activeUsers = users.filter(u => u.is_active)
    const isSelf = (userId: string) => userId === user?.id

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
                <div className="max-w-[1000px] mx-auto w-full">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-6"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/30">
                                <Users className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-primary font-sans">Team Members</h1>
                                <p className="text-xs text-muted font-mono">{activeUsers.length} active members</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Join Code Card */}
                    {joinCode && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="mb-6 border border-amber/30 rounded-xl bg-amber/5 p-5"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber/10">
                                        <KeyRound className="w-4 h-4 text-amber" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-mono text-muted">Magic Join Code</p>
                                        <p className="text-2xl font-bold text-primary font-mono tracking-[0.15em] mt-0.5">
                                            {joinCode}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        id="copy-join-code-btn"
                                        onClick={copyJoinCode}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold bg-amber text-base hover:bg-amber/90 transition-all"
                                    >
                                        {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        {copiedCode ? 'Copied!' : 'Copy Code'}
                                    </button>
                                    <button
                                        id="regenerate-join-code-btn"
                                        onClick={handleRegenerateCode}
                                        disabled={regenerating}
                                        title="Generate a new code (invalidates old one)"
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono bg-elevated border border-dim hover:border-amber/30 text-secondary transition-all disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
                                        Regenerate
                                    </button>
                                </div>
                            </div>
                            <p className="text-[10px] font-mono text-muted/60 mt-3">
                                Share this code with employees so they can join <span className="text-amber/80">{joinCodeOrgName}</span>. Regenerating will invalidate the old code.
                            </p>
                        </motion.div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-1 p-1 rounded-lg bg-elevated border border-dim w-fit mb-6">
                        {[
                            { key: 'active', label: 'Active Members', count: activeUsers.length },
                            { key: 'pending', label: 'Not Yet Onboarded', count: orgMembers.length },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as 'active' | 'pending')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono transition-all ${activeTab === tab.key
                                    ? 'bg-accent text-base font-bold'
                                    : 'text-muted hover:text-secondary'
                                    }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] ${activeTab === tab.key ? 'bg-base/20 text-base' : 'bg-dim text-muted'}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Active Members Tab */}
                    {activeTab === 'active' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border border-dim rounded-xl bg-surface/60 overflow-hidden"
                        >
                            {/* Table Header */}
                            <div className="grid grid-cols-[40px_1fr_120px_140px_100px_80px] gap-4 px-5 py-3 border-b border-dim text-[10px] font-mono uppercase tracking-wider text-muted">
                                <span></span>
                                <span>User</span>
                                <span>Role</span>
                                <span>Team</span>
                                <span>Last Active</span>
                                <span></span>
                            </div>

                            {/* Table Rows */}
                            {activeUsers.map((member) => (
                                <div
                                    key={member.id}
                                    className="grid grid-cols-[40px_1fr_120px_140px_100px_80px] gap-4 px-5 py-3 border-b border-dim/50 last:border-0 items-center hover:bg-elevated/30 transition-colors group"
                                >
                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-elevated border border-dim">
                                        {member.github_avatar_url ? (
                                            <img src={member.github_avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-muted">
                                                {member.username?.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-sans font-medium text-primary truncate">{member.username}</span>
                                            {isSelf(member.id) && (
                                                <span className="text-[9px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">you</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-mono text-muted">@{member.github_username}</span>
                                    </div>

                                    {/* Role Dropdown */}
                                    <div>
                                        {isSelf(member.id) ? (
                                            <span className="flex items-center gap-1 text-xs font-mono text-secondary">
                                                {roleIcon(member.kachow_role)}
                                                {member.kachow_role}
                                            </span>
                                        ) : (
                                            <RoleDropdown
                                                value={member.kachow_role}
                                                onChange={(role) => handleRoleChange(member.id, role)}
                                            />
                                        )}
                                    </div>

                                    {/* Team (editable) */}
                                    <div>
                                        {isSelf(member.id) ? (
                                            <span className="text-xs font-mono text-secondary">{member.team || '—'}</span>
                                        ) : (
                                            <EditableTeam
                                                value={member.team || ''}
                                                onSave={(team) => handleTeamChange(member.id, team)}
                                            />
                                        )}
                                    </div>

                                    {/* Last Active */}
                                    <span className="text-[10px] font-mono text-muted">
                                        {formatLastActive(member.last_login_at)}
                                    </span>

                                    {/* Deactivate */}
                                    <div>
                                        {!isSelf(member.id) && (
                                            <button
                                                onClick={() => setDeactivateModal(member)}
                                                className="text-[10px] font-mono text-red/60 hover:text-red opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                Deactivate
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {activeUsers.length === 0 && (
                                <div className="py-12 text-center">
                                    <p className="text-sm text-muted font-mono">No active members</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Not Yet Onboarded Tab */}
                    {activeTab === 'pending' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {/* Stats bar */}
                            <div className="flex items-center justify-between mb-4 px-1">
                                <p className="text-xs font-mono text-muted">
                                    {orgStats.onboarded} of {orgStats.total} org members onboarded
                                </p>
                                <button
                                    onClick={copyInviteLink}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-accent text-base hover:bg-accent/90 transition-all"
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {copied ? 'Copied!' : 'Copy Invite Link'}
                                </button>
                            </div>

                            <div className="border border-dim rounded-xl bg-surface/60 overflow-hidden">
                                {loadingMembers ? (
                                    <div className="py-12 flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 text-accent animate-spin" />
                                    </div>
                                ) : orgMembers.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <UserPlus className="w-6 h-6 text-muted/40 mx-auto mb-2" />
                                        <p className="text-sm text-muted font-mono">All org members have logged in!</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-dim/50">
                                        {orgMembers.map((member) => (
                                            <div key={member.github_id} className="flex items-center justify-between px-5 py-3 hover:bg-elevated/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-elevated border border-dim">
                                                        {member.github_avatar_url ? (
                                                            <img src={member.github_avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-muted">
                                                                {member.github_username?.slice(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-sans font-medium text-primary">@{member.github_username}</span>
                                                        <p className="text-[10px] font-mono text-muted">Not yet logged into Archon</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={copyInviteLink}
                                                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono bg-elevated border border-dim hover:border-accent/30 text-secondary transition-all"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    Copy Link
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Deactivate Confirmation Modal */}
            <AnimatePresence>
                {deactivateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 backdrop-blur-sm"
                        onClick={() => setDeactivateModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-sm bg-surface border border-dim rounded-xl p-6 space-y-4"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red" />
                                    <h3 className="text-sm font-bold text-primary font-sans">Deactivate User</h3>
                                </div>
                                <button onClick={() => setDeactivateModal(null)} className="text-muted hover:text-primary">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs font-mono text-secondary">
                                Are you sure you want to deactivate <span className="text-primary font-bold">@{deactivateModal.github_username}</span>?
                                They will be blocked on their next login attempt.
                            </p>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setDeactivateModal(null)}
                                    className="flex-1 py-2 rounded-lg text-xs font-mono bg-elevated border border-dim hover:bg-elevated/80 text-secondary transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeactivate}
                                    className="flex-1 py-2 rounded-lg text-xs font-mono font-bold bg-red text-white hover:bg-red/90 transition-all"
                                >
                                    Deactivate
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ── Inline Role Dropdown ──
function RoleDropdown({ value, onChange }: { value: string; onChange: (role: string) => void }) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const roles = [
        { value: 'admin', label: 'Admin', icon: Shield, color: 'text-amber' },
        { value: 'engineer', label: 'Engineer', icon: Code2, color: 'text-accent' },
        { value: 'viewer', label: 'Viewer', icon: Eye, color: 'text-muted' },
    ]

    const current = roles.find(r => r.value === value) || roles[1]

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono bg-elevated border border-dim hover:border-accent/30 transition-all"
            >
                <current.icon className={`w-3 h-3 ${current.color}`} />
                {current.label}
                <ChevronDown className="w-3 h-3 text-muted" />
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-1 w-[130px] bg-surface border border-dim rounded-lg shadow-xl z-10 overflow-hidden">
                    {roles.map(r => (
                        <button
                            key={r.value}
                            onClick={() => { onChange(r.value); setOpen(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-mono hover:bg-elevated transition-colors ${r.value === value ? 'bg-elevated/50 text-primary' : 'text-secondary'}`}
                        >
                            <r.icon className={`w-3 h-3 ${r.color}`} />
                            {r.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Inline Editable Team ──
function EditableTeam({ value, onSave }: { value: string; onSave: (val: string) => void }) {
    const [editing, setEditing] = useState(false)
    const [val, setVal] = useState(value)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus()
        }
    }, [editing])

    const handleBlur = () => {
        setEditing(false)
        if (val !== value) {
            onSave(val)
        }
    }

    if (editing) {
        return (
            <input
                ref={inputRef}
                value={val}
                onChange={e => setVal(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={e => { if (e.key === 'Enter') handleBlur() }}
                className="w-full px-2 py-1 rounded bg-elevated border border-accent/30 font-mono text-xs text-primary focus:outline-none"
                placeholder="Team name..."
            />
        )
    }

    return (
        <button
            onClick={() => setEditing(true)}
            className="text-xs font-mono text-secondary hover:text-primary transition-colors text-left truncate max-w-full"
        >
            {value || <span className="text-muted/40 italic">Set team...</span>}
        </button>
    )
}
