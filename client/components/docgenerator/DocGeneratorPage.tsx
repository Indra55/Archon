import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { TopControlBar } from './TopControlBar'
import { DocFileTree } from './DocFileTree'
import { DiffEditorPane } from './DiffEditorPane'
import { ContextSidebar } from './ContextSidebar'
import { useDocGenerator } from '@/hooks/useDocGenerator'
import type { TemplateId } from '@/hooks/useDocGenerator'
import { DOC_TREE } from '@/data/docGeneratorMockData'

export function DocGeneratorPage() {
    const gen = useDocGenerator()
    const searchParams = useSearchParams()
    const [isGenerating, setIsGenerating] = useState(false)

    useEffect(() => {
        // Note: searchParams is only available in a client component bounded by Suspense
        // if using Next.js 13+ app directory. Just assuming it works natively in this setup.
        if (!searchParams) return

        const serviceParam = searchParams.get('service')
        const templateParam = searchParams.get('template')

        if (serviceParam) {
            if (!gen.expandedServices.includes(serviceParam)) {
                gen.toggleServiceExpand(serviceParam)
            }

            const service = DOC_TREE.find(s => s.serviceId === serviceParam)
            if (service && service.docs.length > 0) {
                if (!gen.selectedDocId) {
                    gen.selectDoc(service.docs[0].id)
                }
            }

            if (templateParam) {
                gen.setTemplate(templateParam as TemplateId)
            }
        }
    }, [searchParams, gen.expandedServices, gen.selectedDocId, gen.toggleServiceExpand, gen.selectDoc, gen.setTemplate])

    const handleGenerate = () => {
        setIsGenerating(true)
        setTimeout(() => {
            setIsGenerating(false)
            // Logic would be here to simulate mock data insertion
        }, 1800)
    }

    return (
        <div className="flex flex-col overflow-hidden bg-[#0A0A0A] text-gray-200" style={{ height: 'calc(100vh - 56px)' }}>
            <TopControlBar
                selectedDoc={gen.selectedDoc}
                selectedTemplate={gen.selectedTemplate}
                onTemplateChange={gen.setTemplate}
                reviewMode={gen.reviewMode}
                onEnterHunkMode={gen.enterHunkMode}
                onExitHunkMode={gen.exitHunkMode}
                acceptedCount={gen.acceptedCount}
                totalHunkCount={gen.totalHunkCount}
                allResolved={gen.allResolved}
                onAcceptAll={gen.acceptAll}
                onRejectAll={gen.rejectAll}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
            />

            <div className="flex flex-1 overflow-hidden">
                <DocFileTree
                    tree={DOC_TREE}
                    selectedDocId={gen.selectedDocId}
                    onSelectDoc={gen.selectDoc}
                    isCollapsed={gen.isTreeCollapsed}
                    onToggleCollapse={gen.toggleTree}
                    expandedServices={gen.expandedServices}
                    onToggleService={gen.toggleServiceExpand}
                />

                <DiffEditorPane
                    doc={gen.selectedDoc}
                    reviewMode={gen.reviewMode}
                    hunks={gen.hunks}
                    currentHunkIndex={gen.currentHunkIndex}
                    onAcceptHunk={gen.acceptHunk}
                    onRejectHunk={gen.rejectHunk}
                    onSkipHunk={() => gen.goToHunk(gen.currentHunkIndex + 1)}
                    isSidebarOpen={gen.isSidebarOpen}
                    onToggleSidebar={gen.toggleSidebar}
                    allResolved={gen.allResolved}
                    onSelectDoc={gen.selectDoc}
                    totalHunkCount={gen.totalHunkCount}
                />

                <ContextSidebar
                    isOpen={gen.isSidebarOpen}
                    onClose={gen.toggleSidebar}
                    selectedDocId={gen.selectedDocId}
                    reviewMode={gen.reviewMode}
                    hunks={gen.hunks}
                    currentHunkIndex={gen.currentHunkIndex}
                    onPrevHunk={() => gen.goToHunk(gen.currentHunkIndex - 1)}
                    onNextHunk={() => gen.goToHunk(gen.currentHunkIndex + 1)}
                />
            </div>
        </div>
    )
}
