'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { PatientContextChip } from '@/components/synapse/schedule/patient-context-chip'
import type { MessageThread, Message } from './types'

// SMS segment threshold
const SMS_SEGMENT = 160

interface PatientInfo {
  mrn: string
  name: string
  initials: string
  age: number
  sex: string
  allergyCount: number
}

interface NewComposePaneProps {
  patient: PatientInfo
  returnTo: string
  onClose: () => void
  onThreadCreated: (thread: MessageThread, firstMessage: Message) => void
}

export function NewComposePane({
  patient,
  returnTo,
  onClose,
  onThreadCreated,
}: NewComposePaneProps) {
  const [channel, setChannel] = useState<'email' | 'sms'>('email')
  const [draft, setDraft] = useState('')
  const sendingRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isSms = channel === 'sms'
  const charCount = draft.length
  const segments = isSms ? Math.ceil(charCount / SMS_SEGMENT) || 1 : 0
  const smsWarning = isSms && segments >= 2

  const handleSend = useCallback(async () => {
    const body = draft.trim()
    if (!body || sendingRef.current) return
    sendingRef.current = true

    try {
      // 1. Create thread
      const threadRes = await fetch('/api/messages/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_mrn: patient.mrn,
          patient_name: patient.name,
          patient_initials: patient.initials,
          patient_age: patient.age,
          patient_sex: patient.sex,
          patient_allergy_count: patient.allergyCount,
          channel,
        }),
      })
      const threadJson = await threadRes.json()
      if (!threadRes.ok) throw new Error(threadJson.error ?? 'Could not create thread')

      const newThread: MessageThread = threadJson.thread

      // 2. Send first message
      const msgRes = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: newThread.id,
          channel,
          body,
          patient_mrn: patient.mrn,
        }),
      })
      const msgJson = await msgRes.json()
      if (!msgRes.ok) throw new Error(msgJson.error ?? 'Send failed')

      toast.success(`Message saved (demo mode — not delivered to ${patient.name})`)
      onThreadCreated(newThread, msgJson.message as Message)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Send failed')
    } finally {
      sendingRef.current = false
    }
  }, [draft, channel, patient, onThreadCreated])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden border-l border-border bg-background">
      {/* Header */}
      <div className="shrink-0 px-5 py-3 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">New message to {patient.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">Channel:</span>
            <button
              onClick={() => setChannel('email')}
              className={`text-xs px-2 py-0.5 rounded-md border transition-colors ${
                channel === 'email'
                  ? 'border-accent bg-accent/10 text-accent font-medium'
                  : 'border-border text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setChannel('sms')}
              className={`text-xs px-2 py-0.5 rounded-md border transition-colors ${
                channel === 'sms'
                  ? 'border-accent bg-accent/10 text-accent font-medium'
                  : 'border-border text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              SMS
            </button>
          </div>
        </div>
      </div>

      {/* Patient context bar */}
      <PatientContextChip
        mrn={patient.mrn}
        name={patient.name}
        initials={patient.initials}
        sex={patient.sex}
        age={patient.age}
        allergyCount={patient.allergyCount}
        returnTo={returnTo}
        onClear={onClose}
      />

      {/* Empty thread area */}
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground px-8 text-center">
        No messages yet. Compose below to start the conversation.
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background shrink-0">
        <div className="px-4 py-2 bg-signal-med-bg border-b border-signal-med/30 text-xs text-signal-med flex items-center gap-1.5">
          <span className="font-medium">Demo mode</span>
          <span className="text-signal-med">— messages are not delivered to patients.</span>
        </div>

        <div className="px-4 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`New message via ${isSms ? 'SMS' : 'email'}…`}
            rows={4}
            className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
          />
        </div>

        <div className="px-4 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isSms && charCount > 0 && (
              <span className={`text-xs tabular-nums ${smsWarning ? 'text-signal-med' : 'text-muted-foreground'}`}>
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
              onClick={() => setDraft('')}
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
    </div>
  )
}
