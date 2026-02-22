'use client'

import { motion } from 'framer-motion'
import { FileEdit, ChevronRight } from 'lucide-react'
import type { DocService } from '@/data/docGeneratorMockData'
import { DocStatusBadge } from './DocStatusBadge'
import { StalenessAlert } from './StalenessAlert'

interface DocGeneratorLandingProps {
  services: DocService[]
  alerts: Array<{
    id: string
    serviceId: string
    serviceName: string
    message: string
    severity: 'high' | 'medium'
    triggeredAt: string
  }>
  onSelectService: (service: DocService) => void
  onAlertAction?: (serviceId: string) => void
}

export function DocGeneratorLanding({
  services,
  alerts,
  onSelectService,
  onAlertAction,
}: DocGeneratorLandingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileEdit className="w-8 h-8 text-accent" />
          <h1 className="font-sans text-2xl font-bold text-primary tracking-tight">
            Doc Generator
          </h1>
        </div>
        <p className="font-mono text-sm text-secondary leading-relaxed">
          AI-detected code changes are turned into documentation diffs. Review,
          accept, and ship always-current docs.
        </p>
      </div>

      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
            Alerts
          </p>
          {alerts.map((alert) => (
            <StalenessAlert
              key={alert.id}
              message={alert.message}
              serviceName={alert.serviceName}
              severity={alert.severity}
              triggeredAt={alert.triggeredAt}
              onAction={
                onAlertAction
                  ? () => {
                      const svc = services.find((s) => s.id === alert.serviceId)
                      if (svc) onSelectService(svc)
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
          Services
        </p>
        <div className="space-y-2">
          {services.map((svc, idx) => (
            <motion.button
              key={svc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onSelectService(svc)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-dim bg-surface/50 hover:bg-elevated hover:border-focus/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium text-primary">
                  {svc.name}
                </span>
                <DocStatusBadge status={svc.status} size="sm" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-muted">
                  {svc.docFiles.length} file{svc.docFiles.length !== 1 ? 's' : ''} · {svc.lastUpdated}
                </span>
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
