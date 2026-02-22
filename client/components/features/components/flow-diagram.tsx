'use client'

import { ArrowRight } from 'lucide-react'

interface FlowNode {
  id: string
  label: string
}

interface FlowDiagramProps {
  nodes?: FlowNode[]
  title?: string
}

const DEFAULT_NODES: FlowNode[] = [
  { id: '1', label: 'Request' },
  { id: '2', label: 'API Gateway' },
  { id: '3', label: 'Service Logic' },
  { id: '4', label: 'Database' },
  { id: '5', label: 'Response' },
]

export function FlowDiagram({
  nodes = DEFAULT_NODES,
  title = 'System Flow',
}: FlowDiagramProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
        {title}
      </h4>
      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {nodes.map((node, index) => (
          <div key={node.id} className="flex items-center gap-2 flex-shrink-0">
            <div className="px-3 py-2 bg-accent/10 border border-accent/50 rounded text-xs font-mono text-accent whitespace-nowrap">
              {node.label}
            </div>
            {index < nodes.length - 1 && (
              <ArrowRight size={16} className="text-accent/50 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
