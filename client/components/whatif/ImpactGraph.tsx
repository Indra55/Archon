'use client'

import React, { useEffect, useState } from 'react'
import { Maximize2 } from 'lucide-react'

export interface GraphNode {
    id: string
    label: string
    type: string
    state: 'direct' | 'transitive' | 'unaffected'
}

export interface GraphEdge {
    id: string
    source: string
    target: string
    label: string
}

interface ImpactGraphProps {
    nodes?: GraphNode[]
    edges?: GraphEdge[]
}

export function ImpactGraph({ nodes = [], edges = [] }: ImpactGraphProps): React.JSX.Element {
    const [step, setStep] = useState(0)

    useEffect(() => {
        const sequence = [
            { step: 1, delay: 300 },
            { step: 2, delay: 900 },
            { step: 3, delay: 1300 },
            { step: 4, delay: 1700 },
            { step: 5, delay: 2100 },
            { step: 6, delay: 2600 }
        ]
        sequence.forEach(s => setTimeout(() => setStep(s.step), s.delay))
    }, [nodes])

    // Simple layout logic if positions aren't provided
    const getNodePos = (id: string, index: number, total: number) => {
        // Mocking some positions for now if not provided, but ideally we'd use a layout engine or grid
        // Let's create a simple grid layout
        const cols = 4
        const row = Math.floor(index / cols)
        const col = index % cols
        return {
            x: 15 + col * 23,
            y: 20 + row * 25
        }
    }

    return (
        <div id="impact-graph" className="px-6 pt-6 mb-8 scroll-mt-20">
            <h3 className="font-sans text-base font-semibold text-primary mb-4">Impact Visualization</h3>

            <div className="border border-dim rounded-2xl overflow-hidden h-[340px] relative bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.04)_0%,transparent_70%)]">
                <svg width="100%" height="100%" className="absolute inset-0 z-0">
                    <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#252535" />
                        </marker>
                        <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
                        </marker>
                        <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#F59E0B" />
                        </marker>
                    </defs>

                    {/* Edges */}
                    {edges.map((edge, idx) => {
                        const srcIdx = nodes.findIndex(n => n.id === edge.source)
                        const tgtIdx = nodes.findIndex(n => n.id === edge.target)
                        if (srcIdx === -1 || tgtIdx === -1) return null

                        const src = getNodePos(edge.source, srcIdx, nodes.length)
                        const tgt = getNodePos(edge.target, tgtIdx, nodes.length)
                        
                        const srcNode = nodes[srcIdx]
                        const tgtNode = nodes[tgtIdx]
                        
                        const isRed = (srcNode.state === 'direct' || tgtNode.state === 'direct') && step >= 2
                        const isAmber = !isRed && (srcNode.state === 'transitive' || tgtNode.state === 'transitive') && step >= 4
                        const inAnim = (isRed && step === 2) || (isAmber && step === 4)

                        return (
                            <g key={edge.id || idx}>
                                <line
                                    x1={`${src.x}%`} y1={`${src.y}%`}
                                    x2={`${tgt.x}%`} y2={`${tgt.y}%`}
                                    stroke="#252535"
                                    strokeWidth="1"
                                    opacity="0.5"
                                />
                                {(isRed || isAmber) && (
                                    <line
                                        x1={`${src.x}%`} y1={`${src.y}%`}
                                        x2={`${tgt.x}%`} y2={`${tgt.y}%`}
                                        stroke={isRed ? "#EF4444" : "#F59E0B"}
                                        strokeWidth="1.5"
                                        strokeDasharray={inAnim ? "4 4" : "none"}
                                        className={inAnim ? "animate-[dashTravel_400ms_linear_forwards]" : ""}
                                        markerEnd={`url(#${isRed ? 'arrow-red' : 'arrow-amber'})`}
                                    />
                                )}
                            </g>
                        )
                    })}

                    {/* Pulse Effects */}
                    {nodes.filter(n => n.state === 'direct').map((node) => {
                        const idx = nodes.findIndex(n => n.id === node.id)
                        const pos = getNodePos(node.id, idx, nodes.length)
                        return step === 1 && (
                            <circle key={`pulse-${node.id}`} cx={`${pos.x}%`} cy={`${pos.y}%`} r="40" fill="none" stroke="#EF4444" className="animate-[pulseRing_600ms_ease-out_forwards]" />
                        )
                    })}

                    {/* Nodes */}
                    {nodes.map((node, idx) => {
                        const pos = getNodePos(node.id, idx, nodes.length)
                        let fill = "rgba(15,15,25,0.8)"
                        let stroke = "#252535"
                        let textFill = "#44445A"

                        if (node.state === 'direct' && step >= 1) { fill = "rgba(239,68,68,0.15)"; stroke = "#EF4444"; textFill = "#EDEDF5" }
                        else if (node.state === 'transitive' && step >= 3) { fill = "rgba(245,158,11,0.12)"; stroke = "#F59E0B"; textFill = "#EDEDF5" }

                        return (
                            <g key={node.id} className="transition-all duration-300">
                                <rect
                                    x={`calc(${pos.x}% - 55px)`}
                                    y={`calc(${pos.y}% - 18px)`}
                                    width="110"
                                    height="36"
                                    rx="8"
                                    fill={fill}
                                    stroke={stroke}
                                    strokeWidth={stroke === '#252535' ? 1 : 1.5}
                                />
                                <text
                                    x={`${pos.x}%`}
                                    y={`${pos.y}%`}
                                    dy="4"
                                    fill={textFill}
                                    fontFamily="'IBM Plex Mono', monospace"
                                    fontSize="10px"
                                    textAnchor="middle"
                                    className="transition-colors duration-300"
                                >
                                    {node.label.length > 15 ? node.label.substring(0, 12) + '...' : node.label}
                                </text>
                            </g>
                        )
                    })}
                </svg>

                <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
                    <button onClick={() => alert('Fullscreen mockup')} className="bg-elevated/80 backdrop-blur border border-dim rounded-lg px-2.5 py-1.5 font-mono text-xs text-secondary flex items-center gap-1.5 hover:bg-elevated hover:text-primary transition-colors">
                        <Maximize2 className="w-3 h-3" />
                        Fullscreen ⤢
                    </button>
                </div>
            </div>

            <div className="mt-3 flex gap-4">
                <div className="flex items-center gap-1.5 font-mono text-xs text-secondary">
                    <div className="w-2 h-2 rounded-full bg-red/80" /> Direct Impact
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs text-secondary">
                    <div className="w-2 h-2 rounded-full bg-amber/80" /> Transitive
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes pulseRing {
          0% { r: 20px; opacity: 0; }
          30% { opacity: 0.6; }
          100% { r: 60px; opacity: 0; }
        }
        @keyframes pulseRingSmall {
          0% { r: 20px; opacity: 0; }
          30% { opacity: 0.6; }
          100% { r: 40px; opacity: 0; }
        }
        @keyframes dashTravel {
          from { stroke-dashoffset: 40; }
          to { stroke-dashoffset: 0; }
        }
      `}} />
        </div>
    )
}
