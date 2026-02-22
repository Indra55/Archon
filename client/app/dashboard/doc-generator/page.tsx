'use client'

import React, { Suspense } from 'react'
import { DocGeneratorPage } from '@/components/docgenerator/DocGeneratorPage'

export default function Page() {
  return (
    <Suspense fallback={<div className="h-full w-full bg-[#0A0A0A] flex items-center justify-center font-mono text-gray-500">Loading Doc Generator...</div>}>
      <div className="w-full h-full relative">
        <DocGeneratorPage />
      </div>
    </Suspense>
  )
}
