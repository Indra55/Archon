'use client'

import { Suspense } from 'react'
import { ArchitectInterface } from '@/components/features/architect-interface'
import { Loader2 } from 'lucide-react'

function ArchitectLoading() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-accent animate-spin" />
    </div>
  )
}

export default function ArchitectPage() {
  return (
    <div className="w-full h-full">
      <Suspense fallback={<ArchitectLoading />}>
        <ArchitectInterface />
      </Suspense>
    </div>
  )
}
