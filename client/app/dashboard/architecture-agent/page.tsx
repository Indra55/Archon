'use client'
import { ComingSoon } from '@/components/shared/ComingSoon'
import { BrainCircuit } from 'lucide-react'

export default function ArchitectureAgentPage() {
    return <ComingSoon
        name="Architecture Agent"
        description="Describe a system in plain English. Get architecture diagrams, tech stack recommendations, and scaffolded infrastructure."
        icon={BrainCircuit}
    />
}
