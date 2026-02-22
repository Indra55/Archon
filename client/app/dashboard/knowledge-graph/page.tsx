'use client'

import { Suspense } from 'react';
import { KnowledgeGraphPage } from '@/components/knowledgegraph/KnowledgeGraphPage';

export default function KnowledgeGraphRoute() {
    return (
        <Suspense fallback={<div>Loading Knowledge Graph...</div>}>
            <KnowledgeGraphPage />
        </Suspense>
    );
}
