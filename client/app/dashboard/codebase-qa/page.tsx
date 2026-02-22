'use client'
import { ComingSoon } from '@/components/shared/ComingSoon'
import { SearchCode } from 'lucide-react'

export default function CodebaseQAPage() {
    return <ComingSoon
        name="Codebase Intelligence"
        description="Ask any question about the codebase. Get answers with exact file references, line numbers, and diagrams."
        icon={SearchCode}
    />
}
