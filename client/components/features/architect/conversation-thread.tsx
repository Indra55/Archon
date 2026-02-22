'use client'

import { ResponseBlock } from './response-block'

interface Exchange {
  id: string
  userMessage: string
  aiResponse: Array<{
    type: 'text' | 'diagram' | 'decision' | 'fileTree' | 'actions'
    data: any
  }>
}

interface ConversationThreadProps {
  exchanges: Exchange[]
  onAction?: (action: string) => void
}

export function ConversationThread({
  exchanges,
  onAction,
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
          <div className="w-full space-y-4 pr-8">
            {exchange.aiResponse.map((block, blockIdx) => (
              <div key={blockIdx}>
                <ResponseBlock
                  type={block.type}
                  data={block.data}
                  onAction={onAction}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
