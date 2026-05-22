'use client'

import { cn } from '@/lib/utils'
import { safeFormatDate } from '@/lib/utils'
import type { Message } from './types'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound'

  const provenanceParts: string[] = []
  if (isOutbound) {
    provenanceParts.push(`Sent by ${message.sender_name ?? 'Dr. Chen'}`)
    if (message.sender_agent_name) provenanceParts.push(message.sender_agent_name)
  }

  const timestampStr = safeFormatDate(message.sent_at ?? message.created_at)

  const statusLabel =
    message.delivery_status === 'sending'
      ? 'Sending…'
      : message.delivery_status === 'failed'
        ? 'Failed'
        : message.delivery_status === 'mock'
          ? `Sent · ${timestampStr}`
          : message.delivery_status === 'sent'
            ? `Sent · ${timestampStr}`
            : timestampStr

  return (
    <div className={cn('flex flex-col gap-1', isOutbound ? 'items-end' : 'items-start')}>
      {/* Sender label */}
      <p className="text-[11px] text-muted-foreground px-1">
        {isOutbound
          ? provenanceParts.filter(Boolean).join(' · ')
          : (message.sender_name ?? 'Patient')}
        {!isOutbound && timestampStr && (
          <span className="ml-1.5 text-muted-foreground/60">{timestampStr}</span>
        )}
      </p>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words',
          isOutbound
            ? 'bg-accent text-white rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm',
          message.delivery_status === 'failed' && 'opacity-60',
        )}
      >
        {message.body}
      </div>

      {/* Status / meta line for outbound */}
      {isOutbound && (
        <p
          className={cn(
            'text-[11px] px-1',
            message.delivery_status === 'failed'
              ? 'text-red-500'
              : 'text-muted-foreground/70',
          )}
        >
          {statusLabel}
          {message.delivery_status === 'mock' && (
            <span className="ml-1.5 text-muted-foreground/50">(demo — not delivered)</span>
          )}
        </p>
      )}
    </div>
  )
}
