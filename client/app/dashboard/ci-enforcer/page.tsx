'use client'
import React, { Suspense } from 'react'
import { CIEnforcerPage } from '@/components/cienforcer/CIEnforcerPage'

export default function Page() {
    return (
        <Suspense fallback={<div className="h-full w-full bg-[#0A0A0A] flex items-center justify-center font-mono text-gray-500">Loading CI Enforcer...</div>}>
            <CIEnforcerPage />
        </Suspense>
    )
}
