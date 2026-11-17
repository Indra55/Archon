'use client'

import { ArchitectureDiagram } from './architecture-diagram'
import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Download, Folder, FolderOpen, FileCode, FileText, File, Settings } from 'lucide-react'
import { Node, Edge } from '@xyflow/react'

interface ResponseBlockProps {
  type: 'text' | 'diagram' | 'decision' | 'fileTree' | 'actions'
  data: any
  onAction?: (action: string) => void
  busy?: boolean
}

// ── File Tree Helpers ────────────────────────────────────────────────────────

interface TreeNode {
  name: string
  path: string
  isDir: boolean
  children: TreeNode[]
  description?: string
  index?: number // original index for snippet lookup
}

function buildTree(files: string[], snippets?: string[]): TreeNode {
  const root: TreeNode = { name: '', path: '', isDir: true, children: [] }

  files.forEach((filePath: string, idx: number) => {
    const parts = filePath.split('/').filter(Boolean)
    let current = root

    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1
      let child = current.children.find(c => c.name === part)

      if (!child) {
        child = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          isDir: !isFile,
          children: [],
          ...(isFile && { index: idx, description: snippets?.[idx] || '' }),
        }
        current.children.push(child)
      }
      current = child
    })
  })

  // Sort: folders first, then files, alphabetical
  const sortTree = (node: TreeNode) => {
    node.children.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    node.children.forEach(sortTree)
  }
  sortTree(root)

  return root
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const iconClass = "w-4 h-4 flex-shrink-0"
  if (['py', 'js', 'ts', 'go', 'java', 'rs'].includes(ext))
    return <FileCode className={`${iconClass} text-blue-400`} />
  if (['md', 'txt', 'rst'].includes(ext))
    return <FileText className={`${iconClass} text-yellow-400`} />
  if (['yml', 'yaml', 'toml', 'json', 'env'].includes(ext) || name.startsWith('.env'))
    return <Settings className={`${iconClass} text-orange-400`} />
  if (name === 'Dockerfile' || name === 'docker-compose.yml')
    return <FileCode className={`${iconClass} text-cyan-400`} />
  return <File className={`${iconClass} text-muted-foreground`} />
}

function TreeItem({ node, depth, expandedPaths, togglePath, snippets }: {
  node: TreeNode
  depth: number
  expandedPaths: Record<string, boolean>
  togglePath: (path: string) => void
  snippets?: string[]
}) {
  const isExpanded = expandedPaths[node.path]

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors hover:bg-accent/10 ${depth === 0 ? '' : ''
          }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => togglePath(node.path)}
      >
        {/* Expand/collapse arrow for dirs */}
        {node.isDir ? (
          <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </span>
        ) : (
          <span className="w-4 h-4 flex-shrink-0" />
        )}

        {/* Icon */}
        {node.isDir ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-accent/80 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-accent/60 flex-shrink-0" />
          )
        ) : (
          getFileIcon(node.name)
        )}

        {/* Name */}
        <span
          className={`font-mono text-xs truncate ${node.isDir ? 'text-foreground font-bold' : 'text-foreground/80'
            }`}
        >
          {node.name}
        </span>
      </div>

      {/* Description tooltip for files */}
      {!node.isDir && isExpanded && node.description && (
        <div
          className="ml-8 mr-2 mt-1 mb-2 p-2 bg-card/80 border border-muted-foreground/20 rounded text-xs font-mono text-foreground/60"
          style={{ marginLeft: `${depth * 16 + 40}px` }}
        >
          {node.description}
        </div>
      )}

      {/* Children */}
      {node.isDir && isExpanded && (
        <div>
          {node.children.map(child => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              expandedPaths={expandedPaths}
              togglePath={togglePath}
              snippets={snippets}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ResponseBlock({
  type,
  data,
  onAction,
  busy,
}: ResponseBlockProps) {
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({})
  const [allExpanded, setAllExpanded] = useState(false)

  const togglePath = (path: string) => {
    setExpandedPaths(prev => ({ ...prev, [path]: !prev[path] }))
  }

  // Build tree from flat file paths
  const tree = useMemo(() => {
    if (type === 'fileTree' && data.files) {
      const t = buildTree(data.files, data.snippets)
      // Auto-expand top-level dirs
      const initialExpanded: Record<string, boolean> = {}
      t.children.forEach(child => {
        if (child.isDir) initialExpanded[child.path] = true
      })
      return { tree: t, initialExpanded }
    }
    return null
  }, [type, data])

  // Initialize expanded state on first render
  useState(() => {
    if (tree) {
      setExpandedPaths(tree.initialExpanded)
    }
  })

  const toggleAll = () => {
    if (!tree) return
    if (allExpanded) {
      // Collapse all
      setExpandedPaths({})
      setAllExpanded(false)
    } else {
      // Expand all
      const allPaths: Record<string, boolean> = {}
      const walk = (node: TreeNode) => {
        if (node.isDir || node.description) allPaths[node.path] = true
        node.children.forEach(walk)
      }
      walk(tree.tree)
      setExpandedPaths(allPaths)
      setAllExpanded(true)
    }
  }

  switch (type) {
    case 'text':
      return (
        <p className="font-mono text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {data.content}
        </p>
      )

    case 'diagram':
      return <ArchitectureDiagram design={data.design} projectName={data.projectName} />

    case 'decision':
      return (
        <div className="mt-2 bg-card border-l-4 border-accent rounded-r-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-mono font-bold text-xs text-foreground">
                {data.title}
              </h4>
            </div>
            <span className="text-xs bg-accent/10 text-accent rounded px-2 py-0.5 font-mono">
              {data.category}
            </span>
          </div>
          <p className="font-mono text-xs text-foreground/70 mb-3">
            {data.rationale}
          </p>

          {data.alternatives && data.alternatives.length > 0 && (
            <div>
              <button
                onClick={() => setExpandedPaths(prev => ({ ...prev, '__alts__': !prev['__alts__'] }))}
                className="flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ChevronDown
                  size={14}
                  className={`transition-transform ${expandedPaths['__alts__'] ? 'rotate-180' : ''}`}
                />
                Why not alternatives?
              </button>
              {expandedPaths['__alts__'] && (
                <ul className="space-y-1 pl-4">
                  {data.alternatives.map((alt: string, idx: number) => (
                    <li
                      key={idx}
                      className="font-mono text-xs text-muted-foreground"
                    >
                      ❌ {alt}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )

    case 'fileTree':
      return (
        <div className="w-full bg-[#0a0a12] border border-muted-foreground/30 rounded-xl mt-4 mb-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-muted-foreground/20 bg-card/50">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-accent" />
              <span className="font-mono text-xs font-bold text-foreground">
                Project Structure
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                ({data.files?.length || 0} files)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAll}
                className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {allExpanded ? 'Collapse All' : 'Expand All'}
              </button>
              <button disabled={busy} onClick={() => onAction?.('download')} className="flex items-center gap-1.5 font-mono text-xs text-accent hover:text-accent/80 transition-colors disabled:opacity-40">
                <Download size={12} />
                Download
              </button>
            </div>
          </div>

          {/* Tree */}
          <div className="py-2 max-h-[400px] overflow-y-auto scrollbar-thin">
            {tree?.tree.children.map(child => (
              <TreeItem
                key={child.path}
                node={child}
                depth={0}
                expandedPaths={expandedPaths}
                togglePath={togglePath}
                snippets={data.snippets}
              />
            ))}
          </div>
        </div>
      )

    case 'actions':
      return (
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            disabled={busy}
            onClick={() => onAction?.('scaffold')}
            className="px-5 py-2.5 bg-accent text-background rounded-lg font-mono text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            {data.hasFiles ? 'Download Scaffold' : 'Scaffold This Project'}
          </button>
          <button
            disabled={busy}
            onClick={() => onAction?.('modify')}
            className="px-5 py-2.5 bg-card border border-muted-foreground/30 text-foreground rounded-lg font-mono text-sm font-medium hover:border-accent/60 transition-colors"
          >
            Modify Architecture
          </button>
          <button
            disabled={busy}
            onClick={() => onAction?.('export')}
            className="px-5 py-2.5 bg-transparent border border-muted-foreground/30 text-foreground rounded-lg font-mono text-sm font-medium hover:border-accent/60 transition-colors"
          >
            Export Blueprint
          </button>
        </div>
      )

    default:
      return null
  }
}
