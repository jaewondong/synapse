'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { PatientContextChip } from '@/components/synapse/schedule/patient-context-chip'
import { MessageThread } from './message-thread'
import { ReplyComposer } from './reply-composer'
import type { MessageThread as ThreadType, Message } from './types'

interface MessageReadingPaneProps {
  thread: ThreadType
  messages: Message[]
  draft: string
  focusTrigger: number
  onDraftChange: (value: string) => void
  onClose: () => void
  onMessageSent: (message: Message) => void
}

export function MessageReadingPane({
  thread,
  messages,
  draft,
  focusTrigger,
  onDraftChange,
  onClose,
  onMessageSent,
}: MessageReadingPaneProps) {
  const handleSent = useCallback((msg: Message) => {
    onMessageSent(msg)
    toast.success(`Message saved (demo mode — not delivered to ${thread.patient_name})`)
  }, [onMessageSent, thread.patient_name])

  const handleError = useCallback((text: string) => {
    toast.error(`Send failed: ${text}`)
  }, [])

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden border-l border-border bg-background">
      {/* Subject header */}
      <div className="shrink-0 px-5 py-3 border-b border-border">
        <p className="text-sm font-semibold truncate">{thread.subject ?? '(no subject)'}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {thread.channel === 'sms' ? 'SMS' : 'Email'}
        </p>
      </div>

      {/* Patient context bar */}
      <PatientContextChip
        mrn={thread.patient_mrn}
        name={thread.patient_name}
        initials={thread.patient_initials}
        sex={thread.patient_sex ?? ''}
        age={thread.patient_age ?? 0}
        allergyCount={thread.patient_allergy_count}
        returnTo={`/chart/${thread.patient_mrn}`}
        onClear={onClose}
      />

      {/* Thread (scrollable) */}
      <MessageThread messages={messages} />

      {/* Reply composer */}
      <ReplyComposer
        threadId={thread.id}
        channel={thread.channel}
        patientMrn={thread.patient_mrn}
        patientName={thread.patient_name}
        draft={draft}
        onDraftChange={onDraftChange}
        onSent={handleSent}
        onError={handleError}
        focusTrigger={focusTrigger}
      />
    </div>
  )
}
