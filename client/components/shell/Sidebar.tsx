'use client'

import React, { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/useAppStore'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    BrainCircuit,
    SearchCode,
    Network,
    Zap,
    FileEdit,
    ShieldCheck,
    Compass,
    GitBranch,
    Bandage,
    GitCommit,
    TrendingDown,
    Database,
    Users,
    LogOut,
    Shield
} from 'lucide-react'

interface NavItem {
    label: string
    icon: React.ElementType
    route: string
    section: string
    adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [

    { label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard', section: 'main' },
    { label: 'Architecture Agent', icon: BrainCircuit, route: '/dashboard/architect', section: 'main' },
    { label: 'Codebase Intelligence', icon: SearchCode, route: '/dashboard/search', section: 'main' },
    { label: 'Knowledge Graph', icon: Network, route: '/dashboard/knowledge-graph', section: 'main' },
    { label: 'What-If Analyzer', icon: Zap, route: '/dashboard/what-if', section: 'main' },
    { label: 'Doc Generator', icon: FileEdit, route: '/dashboard/doc-generator', section: 'tools' },
    { label: 'CI Enforcer', icon: ShieldCheck, route: '/dashboard/ci-enforcer', section: 'tools' },
     { label: 'Market Analyzer', icon: TrendingDown, route: '/dashboard/market-analyzer', section: 'tools' },
    { label: 'Onboarding Paths', icon: Compass, route: '/dashboard/onboarding', section: 'tools' },
    { label: 'Timeline', icon: GitBranch, route: '/dashboard/timeline', section: 'explore' },
    { label: 'Self-Healer', icon: Bandage, route: '/dashboard/self-healer', section: 'explore' },
    // Admin-only items
    { label: 'Knowledge Sources', icon: Database, route: '/dashboard/knowledge', section: 'admin', adminOnly: true },
    { label: 'Team Members', icon: Users, route: '/dashboard/team', section: 'admin', adminOnly: true },

]

export function Sidebar() {
    const { isSidebarExpanded, setSidebarExpanded } = useAppStore()
    const { user, isAdmin, logout } = useAuth()

    const pathname = usePathname()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const sections = isAdmin
        ? ['main', 'tools', 'explore', 'admin']
        : ['main', 'tools', 'explore']

    const sectionLabels: Record<string, string> = {
        main: 'CORE',
        tools: 'TOOLS',
        explore: 'EXPLORE',
        admin: 'ADMIN',
    }

    const filteredItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)

    // User initials
    const initials = user?.username
        ? user.username.slice(0, 2).toUpperCase()
        : 'AR'

    return (
        <aside
            onMouseEnter={() => setSidebarExpanded(true)}
            onMouseLeave={() => setSidebarExpanded(false)}
            className="fixed left-0 top-0 h-screen z-40 bg-surface border-r border-dim transition-all duration-240 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col"
            style={{ width: isSidebarExpanded ? 240 : 64 }}
        >
            {/* Top Header */}
            <div className="h-[64px] flex items-center px-[20px] shrink-0 border-b border-dim/50">
                <svg width="24" height="24" viewBox="0 0 24 24" className="text-accent shrink-0">
                    <polygon
                        points="12,2 21,7 21,17 12,22 3,17 3,7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                    />
                </svg>
                <AnimatePresence>
                    {isSidebarExpanded && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.15, duration: 0.2 }}
                            className="ml-3 font-sans font-bold text-primary tracking-[-0.02em] text-[1.1rem] whitespace-nowrap"
                        >
                            Archon
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Nav Items */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-none">
                {sections.map((sectionName) => (

                    <div key={sectionName} className="mb-2">
                        <AnimatePresence>
                            {isSidebarExpanded && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: 0.15, duration: 0.2 }}
                                    className={`font-mono text-[9px] uppercase tracking-widest px-4 mb-1 mt-4 first:mt-0 whitespace-nowrap ${sectionName === 'admin' ? 'text-amber' : 'text-muted'}`}
                                >
                                    {sectionLabels[sectionName] || sectionName.toUpperCase()}

                                </motion.div>
                            )}
                        </AnimatePresence>

                        {filteredItems.filter((i) => i.section === sectionName).map((item) => {

                            const isActive = mounted && pathname === item.route

                            return (
                                <Link key={item.route} href={item.route}>
                                    <div className={`flex items-center px-4 gap-3 cursor-pointer relative h-[44px] transition-colors duration-120 ${isActive ? 'bg-elevated' : 'hover:bg-elevated/50'}`}>
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeBar"
                                                className={`absolute left-0 w-[3px] h-[22px] rounded-full ${item.adminOnly ? 'bg-amber' : 'bg-accent'}`}

                                                initial={{ scaleY: 0 }}
                                                animate={{ scaleY: 1 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                            />
                                        )}

                                        <item.icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-muted group-hover:text-secondary'}`} />

                                        <AnimatePresence>
                                            {isSidebarExpanded && (
                                                <motion.span
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ delay: 0.15, duration: 0.2 }}
                                                    className={`font-mono text-[0.8rem] font-medium whitespace-nowrap overflow-hidden transition-colors ${isActive ? 'text-primary' : 'text-muted group-hover:text-secondary'}`}
                                                >
                                                    {item.label}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ))}
            </div>

            {/* Bottom Pinned */}
            <div className="shrink-0 border-t border-dim">
                <div className="flex items-center px-4 h-[52px] cursor-pointer hover:bg-elevated transition-colors">
                    <div
                        className="w-[28px] h-[28px] shrink-0 rounded-full bg-elevated flex items-center justify-center overflow-hidden border border-dim"
                        style={{
                            marginLeft: isSidebarExpanded ? 0 : 'auto',
                            marginRight: isSidebarExpanded ? 0 : 'auto',
                        }}
                    >
                        {user?.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-mono text-xs text-secondary">{initials}</span>
                        )}
                    </div>
                    <AnimatePresence>
                        {isSidebarExpanded && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.15, duration: 0.2 }}
                                className="flex flex-col justify-center ml-3 whitespace-nowrap overflow-hidden flex-1 min-w-0"
                            >
                                <span className="font-mono text-xs text-primary truncate">{user?.username || 'User'}</span>
                                <span className="font-mono text-[10px] text-muted leading-tight flex items-center gap-1">
                                    {isAdmin && <Shield className="w-2.5 h-2.5 text-amber inline-block" />}
                                    {user?.kachow_role || 'engineer'}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <AnimatePresence>
                        {isSidebarExpanded && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    logout()
                                }}
                                className="ml-auto text-muted hover:text-red transition-colors shrink-0"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </aside>
    )
}
