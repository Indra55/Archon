'use client'

import { motion } from 'framer-motion'
import { FileText, Calendar, Layers } from 'lucide-react'
import type { DocService, DocFile } from '@/data/docGeneratorMockData'
import { DocStatusBadge } from './DocStatusBadge'
import { StalenessAlert } from './StalenessAlert'
import { HunkReviewer } from './HunkReviewer'

interface ContextSidebarProps {
  service: DocService
  file: DocFile | null
  alerts: Array<{
    id: string
    serviceId: string
    serviceName: string
    message: string
    severity: 'high' | 'medium'
    triggeredAt: string
  }>
  onAcceptHunk: (fileId: string, hunkId: string) => void
  onRejectHunk: (fileId: string, hunkId: string) => void
  onAcceptAll: (fileId: string) => void
  onRejectAll: (fileId: string) => void
  onAlertAction?: (serviceId: string) => void
}

export function ContextSidebar({
  service,
  file,
  alerts,
  onAcceptHunk,
  onRejectHunk,
  onAcceptAll,
  onRejectAll,
  onAlertAction,
}: ContextSidebarProps) {
  const serviceAlerts = alerts.filter((a) => a.serviceId === service.id)

  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="w-[280px] shrink-0 flex flex-col border-l border-dim bg-surface/50 overflow-y-auto"
    >
      <div className="p-4 space-y-4">
        {/* Service context */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-muted" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Service
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium text-primary">
              {service.name}
            </span>
            <DocStatusBadge status={service.status} size="sm" />
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-muted">
            <Calendar className="w-3 h-3" />
            <span className="font-mono text-[11px]">
              Last updated {service.lastUpdated}
            </span>
          </div>
        </div>

        {/* Staleness alerts */}
        {serviceAlerts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Alerts
              </span>
            </div>
            <div className="space-y-2">
              {serviceAlerts.map((alert) => (
                <StalenessAlert
                  key={alert.id}
                  message={alert.message}
                  serviceName={alert.serviceName}
                  severity={alert.severity}
                  triggeredAt={alert.triggeredAt}
                  onAction={
                    onAlertAction
                      ? () => onAlertAction(alert.serviceId)
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* File context */}
        {file && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-muted" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Current file
              </span>
            </div>
            <p className="font-mono text-xs text-secondary break-all">
              {file.path}
            </p>

            <HunkReviewer
              hunks={file.hunks}
              fileId={file.id}
              onAcceptHunk={onAcceptHunk}
              onRejectHunk={onRejectHunk}
              onAcceptAll={onAcceptAll}
              onRejectAll={onRejectAll}
            />
          </div>
        )}
      </div>
    </motion.aside>
  )
}
