'use client'

import React, from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { CommandPalette } from './CommandPalette'
import { useAppStore } from '@/lib/useAppStore'

export function AppShell({ children }: { children: React.ReactNode }) {
    const { isSidebarExpanded } = useAppStore()

    return (
        <div className="flex min-h-screen bg-base text-primary">
            <Sidebar />
            <div
                className="flex-1 flex flex-col transition-all duration-240 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ paddingLeft: isSidebarExpanded ? 240 : 64 }}
            >
                <TopBar />
                <main className="flex-1 pt-[56px] min-h-[100vh]">
                    {children}
                </main>
            </div>
            <CommandPalette />
        </div>
    )
}
