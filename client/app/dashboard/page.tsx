'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Github, FolderOpen, Clock, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import { NewProjectModal } from '@/components/features/new-project-modal'
import React from 'react'
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { CommitSparkline } from '@/components/dashboard/CommitSparkline'
import { TopAlerts } from '@/components/dashboard/TopAlerts'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { CompactFeatureGrid } from '@/components/dashboard/CompactFeatureGrid'
import { FeatureLaunchpad } from '@/components/dashboard/FeatureLaunchpad'
import { REPO_STATS, QUALITY_METRICS } from '@/lib/mockData'
import { GitCommit, GitBranch, FileText, Code2, AlertTriangle, Activity, BookOpen, TestTube, MessageSquare, GitPullRequest, Users, AlertOctagon } from 'lucide-react'
import { motion } from 'framer-motion'

interface Project {
  id: string
  name: string
  description: string | null
  github_repo: string
  status: string
  last_run_at: string | null
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch projects
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoadingProjects(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleProjectCreated = (project: Project) => {
    setProjects((prev) => [project, ...prev])
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      return
    }

    setDeletingId(projectId)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId))
      }
    } catch (err) {
      console.error('Failed to delete project:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 30) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="w-full h-full bg-base px-8 pt-8 pb-16 overflow-y-auto scrollbar-none">
      <div className="max-w-[1400px] mx-auto w-full">
        {/* Row 1: Welcome Banner */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <WelcomeBanner />
        </motion.div>

        {/* Projects Section */}
        <motion.div className="space-y-4 mt-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.03 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-accent" />
              <h2 className="text-xl text-foreground font-[var(--font-plex-sans)]">
                Your Projects
              </h2>
              {projects.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent font-mono border border-accent/30">
                  {projects.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-accent text-background font-bold hover:bg-accent/90 transition-all font-mono group"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200" />
              New Project
            </button>
          </div>

          {/* Projects List */}
          {loadingProjects ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-accent animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-accent/20 rounded-lg">
              <Github className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground font-mono mb-1">
                No projects yet
              </p>
              <p className="text-xs text-muted-foreground/60 font-mono mb-4">
                Connect a GitHub repo to get started with KA-CHOW
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-all font-mono"
              >
                <Plus size={14} />
                Create your first project
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-lg border border-accent/20 bg-card/50 hover:border-accent/40 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm text-foreground font-[var(--font-plex-sans)] truncate">
                          {project.name}
                        </h3>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${project.status === 'active'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-muted-foreground/10 text-muted-foreground border border-muted-foreground/20'
                            }`}
                        >
                          {project.status}
                        </span>
                      </div>

                      <a
                        href={`https://github.com/${project.github_repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent/70 hover:text-accent font-mono transition-colors"
                      >
                        <Github size={12} />
                        {project.github_repo}
                        <ExternalLink size={10} />
                      </a>

                      {project.description && (
                        <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                          {project.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-mono">
                          <Clock size={10} />
                          Created {formatTimeAgo(project.created_at)}
                        </span>
                        {project.last_run_at && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-mono">
                            Last run {formatTimeAgo(project.last_run_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/architect?project=${project.id}`}
                        className="px-3 py-1.5 rounded-md text-xs bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-all font-mono opacity-0 group-hover:opacity-100"
                      >
                        Use
                      </Link>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        disabled={deletingId === project.id}
                        className="p-1.5 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      >
                        {deletingId === project.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Row 2: Metrics Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}
        >
          <MetricCard 
            label="TOTAL COMMITS" 
            value={REPO_STATS.totalCommits} 
            delta="+12.5%" 
            deltaPositive={true} 
            icon={GitCommit} 
          />
          <MetricCard 
            label="ACTIVE BRANCHES" 
            value={REPO_STATS.activeBranches} 
            delta="-2.1%" 
            deltaPositive={false} 
            icon={GitBranch} 
          />
          <MetricCard 
            label="DOC COVERAGE" 
            value={QUALITY_METRICS.docCoverage} 
            unit="%"
            delta="+8.3%" 
            deltaPositive={true} 
            icon={FileText} 
          />
          <MetricCard 
            label="API COVERAGE" 
            value={QUALITY_METRICS.apiCoverage} 
            unit="%"
            delta="+5% vs last week" 
            deltaPositive={true} 
            icon={Code2} 
          />
          <MetricCard 
            label="OPEN VIOLATIONS" 
            value={QUALITY_METRICS.openViolations} 
            delta="3 critical" 
            deltaPositive={false} 
            icon={AlertTriangle} 
            iconColor="red"
          />
          <MetricCard 
            label="CODE HEALTH" 
            value={QUALITY_METRICS.codeHealthScore} 
            unit="/100"
            delta="+3 this week" 
            deltaPositive={true} 
            icon={Activity} 
            iconColor="green"
          />
        </motion.div>

        {/* Row 3: Two-Column Section */}
        <motion.div
          className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 mt-6"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}
        >
          {/* Left Column */}
          <div className="flex flex-col">
            <CommitSparkline />

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              <MetricCard label="ADR COVERAGE" value={QUALITY_METRICS.adrCoverage} unit="%" icon={BookOpen} iconColor="purple" />
              <MetricCard label="TEST COVERAGE" value={QUALITY_METRICS.testCoverage} unit="%" icon={TestTube} iconColor="green" />
              <MetricCard label="KNOWLEDGE BASE Q&A" value={142} icon={MessageSquare} iconColor="accent" />
              <MetricCard label="OPEN PRs" value={REPO_STATS.openPRs} icon={GitPullRequest} iconColor="amber" />
              <MetricCard label="CONTRIBUTORS" value={REPO_STATS.contributors} icon={Users} iconColor="accent" />
              <MetricCard label="ARCH DRIFT" value={QUALITY_METRICS.architectureDriftCount} unit=" services" icon={AlertOctagon} iconColor="red" />
            </div>
          </div>

          {/* Right Column */}
          <TopAlerts />
        </motion.div>

        {/* Row 4: Full-Width Section */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.18 }}
        >
          <ActivityFeed />
          <CompactFeatureGrid />
        </motion.div>

        {/* Row 5: Full-Width Feature Launchpad */}
        <FeatureLaunchpad />
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleProjectCreated}
      />
    </div>
  )
}
