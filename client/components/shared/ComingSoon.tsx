import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, LucideIcon, PenTool } from 'lucide-react'
import Link from 'next/link'

interface ComingSoonProps {
    name: string;
    description?: string;
    icon?: LucideIcon;
}

export function ComingSoon({ name, description, icon: Icon = PenTool }: ComingSoonProps) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-56px)] w-full relative z-10">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-[480px] w-full mx-auto border-2 border-dashed border-dim rounded-2xl p-12 text-center"
            >
                <div className="flex justify-center">
                    <Icon className="w-12 h-12 text-muted" />
                </div>

                <h2 className="font-sans text-2xl font-bold text-primary mt-6 tracking-tight">
                    {name}
                </h2>

                <p className="font-mono text-sm text-secondary mt-3 leading-relaxed">
                    {description || "This feature is being built. It will appear here automatically once implemented."}
                </p>

                <div className="bg-elevated border border-dim rounded-full px-4 py-1.5 mt-6 inline-flex items-center gap-2 font-mono text-[11px] text-muted">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                    In Development
                </div>

                <div className="mt-12">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 font-mono text-sm text-secondary hover:text-primary transition-colors cursor-pointer group">
                        <ArrowLeft className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                        Back to Dashboard
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
