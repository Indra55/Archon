'use client'

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

export default function DashboardPage() {
  return (
    <div className="w-full h-full bg-base px-8 pt-8 pb-16 overflow-y-auto scrollbar-none">
      <div className="max-w-[1400px] mx-auto w-full">
        {/* Row 1: Welcome Banner */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <WelcomeBanner />
        </motion.div>

        {/* Row 2: Key Metrics Strip */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}
        >
          <MetricCard label="TOTAL PUSHES" value={REPO_STATS.totalPushesThisWeek} unit="this week" delta="+9 today" deltaPositive={true} icon={GitCommit} iconColor="accent" />
          <MetricCard label="ACTIVE BRANCHES" value={REPO_STATS.activeBranches} unit="of 23" delta="3 ahead of main" deltaPositive={null} icon={GitBranch} iconColor="purple" />
          <MetricCard label="DOC COVERAGE" value={QUALITY_METRICS.docCoverage} unit="%" delta="-2% vs last week" deltaPositive={false} icon={FileText} iconColor="amber" />
          <MetricCard label="API COVERAGE" value={QUALITY_METRICS.apiCoverage} unit="%" delta="+5% vs last week" deltaPositive={true} icon={Code2} iconColor="green" />
          <MetricCard label="OPEN VIOLATIONS" value={QUALITY_METRICS.openViolations} delta="3 critical" deltaPositive={false} icon={AlertTriangle} iconColor="red" />
          <MetricCard label="CODE HEALTH" value={QUALITY_METRICS.codeHealthScore} unit="/100" delta="+3 this week" deltaPositive={true} icon={Activity} iconColor="green" />
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
    </div>
  )
}
