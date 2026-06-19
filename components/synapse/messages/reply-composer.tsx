'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { Message } from './types'

// SMS segment threshold (160 chars per segment)
const SMS_SEGMENT = 160

interface ReplyComposerProps {
  threadId: string
  channel: 'email' | 'sms'
  patientMrn: string
  patientName: string
  draft: string
  onDraftChange: (value: string) => void
  onSent: (message: Message) => void
  onError: (text: string) => void
  focusTrigger?: number
}

export function ReplyComposer({
  threadId,
  channel,
  patientMrn,
  patientName,
  draft,
  onDraftChange,
  onSent,
  onError,
  focusTrigger,
}: ReplyComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sendingRef = useRef(false)

  // Focus when 'R' hotkey fires from parent
  useEffect(() => {
    if (focusTrigger) textareaRef.current?.focus()
  }, [focusTrigger])

  async function handleSend() {
    const body = draft.trim()
    if (!body || sendingRef.current) return
    sendingRef.current = true

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: threadId, channel, body, patient_mrn: patientMrn }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Send failed')
      onDraftChange('')
      onSent(json.message as Message)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      sendingRef.current = false
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const isSms = channel === 'sms'
  const charCount = draft.length
  const segments = isSms ? Math.ceil(charCount / SMS_SEGMENT) || 1 : 0
  const smsWarning = isSms && segments >= 2

  return (
    <div className="border-t border-border bg-background shrink-0">
      {/* Demo mode banner */}
      <div className="px-4 py-2 bg-signal-med-bg border-b border-signal-med/30 text-xs text-signal-med flex items-center gap-1.5">
        <span className="font-medium">Demo mode</span>
        <span className="text-signal-med">— messages are not delivered to patients.</span>
      </div>

      {/* Textarea */}
      <div className="px-4 pt-3 pb-2">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Reply via ${channel === 'sms' ? 'SMS' : 'email'}…`}
          rows={4}
          className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
        />
      </div>

      {/* Footer: SMS counter + actions */}
      <div className="px-4 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {isSms && charCount > 0 && (
            <span className={cn('text-xs tabular-nums', smsWarning ? 'text-signal-med' : 'text-muted-foreground')}>
              {charCount} chars · {segments} segment{segments !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs text-muted-foreground/60 hidden sm:inline">
            {typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? '⌘' : 'Ctrl'}+Enter to send
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDraftChange('')}
            disabled={!draft}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim()}
            className="rounded-md bg-accent text-white px-4 py-1.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
