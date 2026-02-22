'use client'

import { Suspense } from 'react'
import { SelfHealerPage } from '@/components/selfhealer/SelfHealerPage'

export default function Page() {
    return (
        <Suspense fallback={<div>Loading Self Healer...</div>}>
            <SelfHealerPage />
        </Suspense>
    )
}
