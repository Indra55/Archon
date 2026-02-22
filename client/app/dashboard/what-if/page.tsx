// app/dashboard/what-if/page.tsx
'use client'

import React, { Suspense } from 'react'
import { WhatIfPage } from '@/components/whatif/WhatIfPage'

export default function page() {
    return (
        <Suspense>
            <WhatIfPage />
        </Suspense>
    )
}
