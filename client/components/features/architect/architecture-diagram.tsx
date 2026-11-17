'use client'

import { useMemo, useState } from 'react'
import { ReactFlow, Background, Controls, Handle, Position, MarkerType, BaseEdge, EdgeLabelRenderer, type Node, type Edge } from '@xyflow/react'
import { Boxes, Database, Network, Maximize2, Layers, ArrowUpRight } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import '@xyflow/react/dist/style.css'

const palette = { service: '#a5b4fc', database: '#5eead4', gateway: '#fcd34d' }

function ComponentNode({ data, selected }: any) {
  const kind = data.kind as keyof typeof palette
  const Icon = kind === 'database' ? Database : kind === 'gateway' ? Network : Boxes
  const color = palette[kind]
  return (
    <div className="w-[264px] rounded-xl border bg-[#14161d] shadow-[0_12px_36px_#0004] transition-shadow" style={{ borderColor: selected ? color : '#30333f' }}>
      <Handle type="target" position={Position.Top} id="in" style={{ background: color, border: '3px solid #14161d', width: 10, height: 10 }} />
      <Handle type="target" position={Position.Bottom} id="dep-in" style={{ opacity: 0, left: '65%' }} />
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <div className="rounded-lg p-2" style={{ color, background: `${color}14` }}><Icon size={18} /></div>
        <div className="min-w-0"><div className="text-[9px] font-mono uppercase tracking-[.18em] text-zinc-500">{kind === 'service' ? 'Application service' : kind === 'database' ? 'Data store' : 'Entry point'}</div><div className="mt-1 break-words font-sans text-[14px] font-semibold text-zinc-100">{data.label}</div></div>
      </div>
      <div className="px-4 py-3"><p className="line-clamp-2 min-h-9 text-[11px] leading-[18px] text-zinc-400">{data.description || 'No description provided.'}</p><div className="mt-3 flex flex-wrap gap-1.5">{data.tags.filter(Boolean).map((tag: string, i: number) => <span key={i} className="rounded border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] text-zinc-300">{tag}</span>)}</div></div>
      <Handle type="source" position={Position.Bottom} id="out" style={{ background: color, border: '3px solid #14161d', width: 10, height: 10 }} />
      <Handle type="source" position={Position.Bottom} id="dep-out" style={{ opacity: 0, left: '35%' }} />
    </div>
  )
}

function CaptionNode({ data }: any) {
  return <div className="flex items-center gap-2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[.2em] text-zinc-500"><span className="text-zinc-600">{data.number}</span>{data.label}<span className="ml-2 h-px w-16 bg-white/10" /></div>
}
function DependencyEdge({ sourceX, sourceY, targetX, targetY, markerEnd, data }: any) {
  const lane = Math.max(sourceY, targetY) + 32 + (data?.lane || 0) * 16
  const path = `M ${sourceX} ${sourceY} L ${sourceX} ${lane} L ${targetX} ${lane} L ${targetX} ${targetY}`
  return <><BaseEdge path={path} markerEnd={markerEnd} style={{ stroke: palette.service, strokeWidth: 1.3, strokeDasharray: '4 5', opacity: .6 }} /><EdgeLabelRenderer><span className="pointer-events-none absolute rounded bg-[#101217] px-2 py-1 font-mono text-[9px] text-indigo-300" style={{ transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${lane}px)` }}>depends on</span></EdgeLabelRenderer></>
}
const edgeTypes = { dependency: DependencyEdge }

const nodeTypes = { component: ComponentNode, caption: CaptionNode }

export function buildArchitectureGraph(design: any) {
  const nodes: Node[] = [], edges: Edge[] = []
  const services = design.services || [], databases = design.databases || []
  const gateway = design.api_gateway
  const hasGateway = gateway && Object.keys(gateway).length > 0
  const width = Math.max(services.length, databases.length, 1) * 320
  const row = (count: number, i: number) => (width - count * 320) / 2 + i * 320
  const serviceY = hasGateway ? 310 : 55
  const caption = (id: string, label: string, y: number, number: string) => nodes.push({ id, type: 'caption', position: { x: 0, y }, data: { label, number }, selectable: false, draggable: false })
  const edge = (source: string, target: string, label: string, color: string, side = false) => edges.push({
    id: `${source}-${target}`, source, target, sourceHandle: side ? 'dep-out' : 'out', targetHandle: side ? 'dep-in' : 'in', type: side ? 'dependency' : 'smoothstep', data: { lane: edges.filter(e => e.type === 'dependency').length },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
    style: { stroke: color, strokeWidth: 1.4, opacity: .75 }, label,
    labelStyle: { fill: color, fontSize: 10, fontFamily: 'monospace' }, labelBgStyle: { fill: '#101217' }, labelBgPadding: [8, 5], labelBgBorderRadius: 4,
  })
  if (hasGateway) {
    caption('entry-label', 'Traffic & access', 0, '01')
    nodes.push({ id: 'gateway', type: 'component', position: { x: (width - 320) / 2, y: 45 }, data: { kind: 'gateway', label: gateway.name || gateway.type || 'API Gateway', description: (gateway.features || []).join(' · '), tags: [gateway.type, 'Ingress'] } })
  }
  caption('services-label', 'Application layer', serviceY - 45, hasGateway ? '02' : '01')
  services.forEach((service: any, i: number) => {
    nodes.push({ id: `svc-${i}`, type: 'component', position: { x: row(services.length, i), y: serviceY }, data: { kind: 'service', label: service.name, description: service.responsibility, tags: [service.language, service.framework, service.port ? `:${service.port}` : ''] } })
    const exposed = (design.api_endpoints || []).some((api: any) => api.service === service.name) || (service.communication || []).some((protocol: string) => /rest|http|grpc|graphql|websocket/i.test(protocol))
    if (hasGateway && exposed) edge('gateway', `svc-${i}`, service.communication?.[0] || 'API', palette.gateway)
  })
  services.forEach((service: any, i: number) => {
    (service.dependencies || []).forEach((name: string) => {
      const target = services.findIndex((s: any) => s.name?.toLowerCase() === name.toLowerCase())
      if (target >= 0 && target !== i) edge(`svc-${i}`, `svc-${target}`, 'depends on', palette.service, true)
    })
  })
  if (databases.length) caption('data-label', 'Persistence layer', serviceY + 245, hasGateway ? '03' : '02')
  databases.forEach((db: any, i: number) => {
    nodes.push({ id: `db-${i}`, type: 'component', position: { x: row(databases.length, i), y: serviceY + 290 }, data: { kind: 'database', label: db.name || db.engine, description: db.purpose, tags: [db.engine, `${db.tables_or_collections?.length || 0} collections / tables`] } })
    const owner = services.findIndex((s: any) => s.name?.toLowerCase() === db.owned_by?.toLowerCase())
    if (owner >= 0) edge(`svc-${owner}`, `db-${i}`, 'reads / writes', palette.database)
  })
  return { nodes, edges }
}

export function ArchitectureDiagram({ design, projectName }: { design: any; projectName?: string }) {
  const graph = useMemo(() => buildArchitectureGraph(design), [design])
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const canvas = (large: boolean) => <div style={{ height: large ? '76vh' : 680 }} className="relative bg-[#101217]">
    <ReactFlow key={large ? 'large' : 'inline'} nodes={graph.nodes} edges={graph.edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={{ padding: .12, maxZoom: 1 }} minZoom={.2} maxZoom={1.6} nodesConnectable={false} nodesDraggable={false} onNodeClick={(_, node) => node.type === 'component' && setSelected(node.data)} colorMode="dark" proOptions={{ hideAttribution: true }}>
      <Background gap={24} size={1} color="#2a2d38" /><Controls showInteractive={false} />
    </ReactFlow>
  </div>
  return <section className="my-6 overflow-hidden rounded-2xl border border-white/10 bg-[#14161d]" aria-label="System architecture diagram">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
      <div className="flex items-center gap-3"><Layers size={18} className="text-indigo-300" /><div><h3 className="font-sans text-sm font-semibold text-zinc-100">{projectName || 'System architecture'}</h3><p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">{design.architecture_style?.replaceAll('-', ' ')} · {design.services?.length || 0} services · {design.databases?.length || 0} data stores</p></div></div>
      <button aria-label="Expand architecture diagram" onClick={() => setExpanded(true)} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5"><Maximize2 size={13} />Expand</button>
    </div>
    {canvas(false)}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] px-5 py-3 text-[10px] font-mono text-zinc-500"><div className="flex gap-4">{Object.entries(palette).map(([kind, color]) => <span key={kind} className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />{kind}</span>)}</div><span className="flex items-center gap-1">Select a component for details <ArrowUpRight size={12} /></span></div>
    {selected && <div className="border-t border-white/10 px-5 py-4"><h4 className="text-sm font-semibold text-zinc-100">{selected.label}</h4><p className="mt-1 text-xs leading-6 text-zinc-400">{selected.description}</p></div>}
    <Dialog open={expanded} onOpenChange={setExpanded}><DialogContent className="!max-w-[95vw] !w-[95vw] border-white/10 bg-[#14161d] p-0"><DialogTitle className="px-6 pt-5 text-zinc-100">{projectName || 'System architecture'}</DialogTitle>{canvas(true)}{selected && <p className="px-6 pb-5 text-xs text-zinc-400">{selected.label}: {selected.description}</p>}</DialogContent></Dialog>
  </section>
}
