'use client'

import { Suspense } from 'react'
import { TimelinePage } from '@/components/timeline/TimelinePage'

export default function Timeline() {
    return (
        <Suspense fallback={<div>Loading Timeline...</div>}>
            <TimelinePage />
        </Suspense>
    )
}
