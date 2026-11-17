'use client'

import { ResponseBlock } from './response-block'

import type { Exchange } from '../architect-interface'

interface ConversationThreadProps {
  exchanges: Exchange[]
  onAction?: (action: string, exchange: Exchange) => void
  busy?: boolean
}

export function ConversationThread({
  exchanges,
  onAction,
  busy,
}: ConversationThreadProps) {
  return (
    <div className="space-y-8">
      {exchanges.map((exchange, idx) => (
        <div key={exchange.id} className="space-y-4">
          {/* User Message Bubble */}
          <div className="ml-auto max-w-[540px]">
            <div className="bg-card border border-muted-foreground/30 rounded-2xl rounded-tr-sm p-4">
              <p className="font-mono text-sm text-foreground">
                {exchange.userMessage}
              </p>
            </div>
          </div>

          {/* AI Response - sequence of blocks */}
          <div className="w-full space-y-4">
            {exchange.aiResponse.map((block, blockIdx) => (
              <div key={blockIdx}>
                <ResponseBlock
                  type={block.type}
                  data={block.data}
                  onAction={action => onAction?.(action, exchange)}
                  busy={busy}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
