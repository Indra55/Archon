'use client'

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  NodeTypes,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEffect, useMemo, useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

// Custom node components
function ServiceNode({ data }: { data: any }) {
  return (
    <div className="w-[180px] h-[72px] bg-card border border-muted-foreground/30 rounded-lg p-3 hover:border-accent/60 transition-colors cursor-default">
      <div className="font-mono font-bold text-xs text-foreground truncate">
        {data.name}
      </div>
      <div className="font-mono text-xs text-muted-foreground truncate">
        {data.team}
      </div>
      {/* Health dot */}
      <div
        className="absolute top-2 right-2 w-2 h-2 rounded-full"
        style={{
          backgroundColor:
            data.health === 'green'
              ? '#22c55e'
              : data.health === 'amber'
                ? '#f59e0b'
                : '#ef4444',
        }}
      />
      {/* API count badge */}
      <div className="absolute bottom-1 right-2 bg-accent/10 px-1 py-0.5 rounded font-mono text-xs text-accent">
        {data.apis}
      </div>
    </div>
  )
}

function DatabaseNode({ data }: { data: any }) {
  return (
    <div className="w-20 h-24 bg-card border-2 border-green-500 rounded-lg flex items-center justify-center">
      <div className="font-mono text-xs text-foreground text-center">
        {data.label}
      </div>
    </div>
  )
}

function QueueNode({ data }: { data: any }) {
  return (
    <div
      className="w-20 h-20 bg-card border-2 border-amber-500 flex items-center justify-center"
      style={{ transform: 'rotate(45deg)' }}
    >
      <div
        className="font-mono text-xs text-foreground text-center"
        style={{ transform: 'rotate(-45deg)' }}
      >
        {data.label}
      </div>
    </div>
  )
}

function GatewayNode({ data }: { data: any }) {
  return (
    <div className="w-60 h-12 bg-accent/20 border-2 border-accent rounded-lg flex items-center justify-center">
      <div className="font-mono text-xs font-bold text-accent">{data.label}</div>
    </div>
  )
}

interface GraphCanvasProps {
  nodes: Node[]
  edges: Edge[]
  onNodeClick?: (nodeId: string) => void
  onNodeDoubleClick?: (nodeId: string) => void
  animateIn?: boolean
  height?: number
  showMinimap?: boolean
  showControls?: boolean
  readonly?: boolean
}

export function GraphCanvas({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeClick,
  onNodeDoubleClick,
  animateIn = false,
  height = 420,
  showMinimap = false,
  showControls = true,
  readonly = true,
}: GraphCanvasProps) {
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      service: ServiceNode,
      database: DatabaseNode,
      queue: QueueNode,
      gateway: GatewayNode,
    }),
    []
  )

  const [nodes, setNodes] = useNodesState(initialNodes)
  const [edges, setEdges] = useEdgesState(initialEdges)

  // Apply animation on mount
  useEffect(() => {
    if (animateIn) {
      const animatedNodes = initialNodes.map((node, index) => ({
        ...node,
        style: {
          ...node.style,
          opacity: 0,
          animation: `fadeIn 0.4s ease-out ${index * 0.08}s forwards`,
        },
      }))
      setNodes(animatedNodes)
    }
  }, [animateIn, initialNodes, setNodes])

  return (
    <div
      className="w-full bg-background border border-muted-foreground/30 rounded-xl overflow-hidden relative"
      style={{ height: `${height}px` }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={(event, node) => onNodeClick?.(node.id)}
        onNodeDoubleClick={(event, node) => onNodeDoubleClick?.(node.id)}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark" // Forces MiniMap and Controls into dark theme
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="oklch(0.2 0 0)"
        />
        {showControls && <Controls showInteractive={false} />}
        {showMinimap && (
          <MiniMap
            nodeColor="#3f3f46"
            maskColor="rgba(0, 0, 0, 0.7)"
            className="border border-muted-foreground/20 rounded-lg overflow-hidden"
          />
        )}
      </ReactFlow>
    </div>
  )
}
