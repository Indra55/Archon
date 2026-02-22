'use client'

import React, { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/lib/useAppStore'
import { useAuth } from '@/hooks/useAuth'
import { Search, GitBranch, Bell, Shield } from 'lucide-react'

export function TopBar() {
    const { isSidebarExpanded, setCommandPaletteOpen, notifications, markNotificationRead, unreadCount } = useAppStore()
    const { user, isAdmin } = useAuth()

    const userInitials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'KA'

    const pathname = usePathname()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Format breadcrumb
    const pageName = pathname === '/dashboard' ? 'Dashboard'
        : pathname.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Cmd+K to open search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setCommandPaletteOpen(true)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [setCommandPaletteOpen])

    return (
        <header
            className="fixed top-0 right-0 h-[56px] z-30 flex items-center justify-between px-6 transition-all duration-240 border-b border-dim"
            style={{
                width: `calc(100vw - ${isSidebarExpanded ? 240 : 64}px)`,
                background: 'rgba(9, 9, 14, 0.85)',
                backdropFilter: 'blur(12px)'
            }}
        >
            {/* Left */}
            <div className="flex items-center gap-3">
                {pathname !== '/dashboard' && <span className="text-muted font-mono text-[0.8rem]">/</span>}
                <h1 className="font-mono text-[0.8rem] text-secondary font-medium">{pageName}</h1>
            </div>

            {/* Center */}
            <div className="absolute left-1/2 -translate-x-1/2">
                <div
                    onClick={() => setCommandPaletteOpen(true)}
                    className="w-[440px] h-[36px] bg-elevated border border-dim rounded-lg flex items-center px-3 gap-2 cursor-text hover:border-focus transition-colors shadow-sm"
                >
                    <Search className="w-[14px] h-[14px] text-muted" />
                    <span className="flex-1 font-mono text-[0.8rem] text-muted pointer-events-none">
                        Search features, services, docs...
                    </span>
                    <kbd className="bg-surface border border-dim rounded px-1.5 py-0.5 font-mono text-[10px] text-muted">
                        ⌘K
                    </kbd>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
                <div className="bg-elevated border border-dim rounded-full px-3 py-1 flex items-center gap-1.5">
                    <GitBranch className="w-3 h-3 text-muted" />
                    <span className="font-mono text-[11px] text-secondary">my-org/backend</span>
                    <span className="font-mono text-[11px] text-muted">main</span>
                </div>

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="relative p-1 rounded-full hover:bg-elevated transition-colors"
                    >
                        <Bell className="w-[18px] h-[18px] text-secondary" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red text-white font-mono text-[9px] font-bold flex items-center justify-center rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-[40px] right-0 w-[240px] bg-surface border border-dim rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 border-b border-dim">
                                <h3 className="font-mono text-sm font-semibold text-primary">Notifications</h3>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => markNotificationRead(n.id)}
                                        className="px-4 py-3 border-b border-dim last:border-0 flex items-start gap-3 hover:bg-elevated cursor-pointer"
                                    >
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 bg-${n.severity}`} />
                                        <div className="flex-1">
                                            <p className={`font-mono text-[12px] ${n.read ? 'text-muted' : 'text-primary'}`}>{n.text}</p>
                                            <p className="font-mono text-[10px] text-muted mt-0.5">{n.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="px-4 py-3 border-t border-dim text-center hover:bg-elevated cursor-pointer">
                                <span className="text-accent font-mono text-[12px]">View all notifications →</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-[30px] h-[30px] rounded-full bg-elevated font-mono text-[12px] text-secondary flex items-center justify-center cursor-pointer hover:ring-1 hover:ring-focus transition-all overflow-hidden border border-dim" title={`${user?.username || 'User'} (${user?.kachow_role || 'engineer'})`}>
                    {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                        userInitials
                    )}

                </div>
            </div>
        </header>
    )
}
