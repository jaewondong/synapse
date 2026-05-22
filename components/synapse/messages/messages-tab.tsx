'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { cn, formatRelativeTime } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { MessageReadingPane } from './message-reading-pane'
import { NewComposePane } from './new-compose-pane'
import type { MessageThread, Message } from './types'

// Module-level draft store: survives component remounts within a session
const draftStore = new Map<string, string>()
// Module-level set of opened thread IDs: client-side unread tracking
const openedThreads = new Set<string>()

interface PatientContext {
  mrn: string
  name: string
  initials: string
  age: number
  sex: string
  allergyCount: number
}

interface MessagesTabProps {
  selectedThreadId: string | null
  patientMrn: string | null
  compose: string | null
  returnTo: string | null
}

export function MessagesTab({ selectedThreadId, patientMrn, compose, returnTo }: MessagesTabProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [threads, setThreads] = useState<MessageThread[]>([])
  const [threadMessages, setThreadMessages] = useState<Message[]>([])
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [focusTrigger, setFocusTrigger] = useState(0)

  // New-compose mode: set when patient_mrn is present but no open thread exists
  const [composePatient, setComposePatient] = useState<PatientContext | null>(null)

  // Track whether we've already processed the patient_mrn handoff
  const handoffProcessed = useRef(false)

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null

  // Active draft tracked in React state so the textarea re-renders on every keystroke.
  // draftStore persists the draft across thread switches within a session.
  const [activeDraft, setActiveDraft] = useState('')

  useEffect(() => {
    setActiveDraft(selectedThreadId ? (draftStore.get(selectedThreadId) ?? '') : '')
  }, [selectedThreadId])

  const setDraft = useCallback((value: string) => {
    setActiveDraft(value)
    if (selectedThreadId) draftStore.set(selectedThreadId, value)
  }, [selectedThreadId])

  // Fetch thread list
  useEffect(() => {
    async function load() {
      setLoadingThreads(true)
      const { data, error } = await supabase
        .from('message_threads')
        .select('*')
        .order('last_message_at', { ascending: false })
      if (!error && data) setThreads(data as MessageThread[])
      setLoadingThreads(false)
    }
    load()
  }, [])

  // Patient MRN handoff: once threads are loaded, look up existing thread or enter compose mode
  useEffect(() => {
    if (!patientMrn || loadingThreads || handoffProcessed.current) return
    handoffProcessed.current = true

    // Strip handoff params from URL via replaceState (no back-button pile-up)
    const cleanParams = new URLSearchParams(searchParams.toString())
    cleanParams.delete('patient_mrn')
    cleanParams.delete('compose')
    cleanParams.delete('return_to')
    window.history.replaceState({}, '', `/inbox?${cleanParams.toString()}`)

    async function resolveHandoff() {
      // Look up open threads for this patient
      const res = await fetch(`/api/messages/threads?patient_mrn=${patientMrn}`)
      const json = await res.json()

      if (!res.ok) {
        toast.error("Couldn't find that patient.")
        return
      }

      const patientThreads: MessageThread[] = json.threads ?? []
      const forceNew = compose === 'new'

      if (patientThreads.length > 0 && !forceNew) {
        // Existing thread: select it (most recent first from API)
        const thread = patientThreads[0]
        // Merge into thread list if not already there
        setThreads((prev) => {
          const exists = prev.some((t) => t.id === thread.id)
          return exists ? prev : [thread, ...prev]
        })
        selectThread(thread.id)
      } else {
        // No thread or compose=new: look up patient info and enter new-compose mode
        const lookupRes = await fetch(
          `/api/patients/search?mrn=${patientMrn}&directLoad=true`,
        )
        const lookupJson = await lookupRes.json()
        const patients = lookupJson.patients ?? lookupJson ?? []
        const p = Array.isArray(patients) ? patients[0] : null

        if (!p) {
          toast.error("Couldn't find that patient.")
          return
        }

        setComposePatient({
          mrn: p.mrn,
          name: p.name,
          initials: p.initials,
          age: p.age,
          sex: p.sex ?? '',
          allergyCount: 0,
        })
      }
    }

    resolveHandoff()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientMrn, loadingThreads])

  // Fetch messages when selected thread changes
  useEffect(() => {
    if (!selectedThreadId) {
      setThreadMessages([])
      return
    }
    openedThreads.add(selectedThreadId)
    setLoadingMessages(true)
    supabase
      .from('messages')
      .select('*')
      .eq('thread_id', selectedThreadId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setThreadMessages(data as Message[])
        setLoadingMessages(false)
      })
  }, [selectedThreadId])

  // Escape: close reading pane (warn if unsent draft)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (composePatient) {
          setComposePatient(null)
          return
        }
        if (selectedThreadId) {
          const currentDraft = draftStore.get(selectedThreadId) ?? ''
          if (currentDraft.trim()) {
            if (!window.confirm('You have an unsent reply. Discard and close?')) return
            draftStore.delete(selectedThreadId)
          }
          closeThread()
        }
      }
      // 'R' focuses composer
      if (e.key === 'r' && selectedThreadId && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        setFocusTrigger((n) => n + 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId, composePatient])

  function selectThread(id: string) {
    setComposePatient(null)
    const params = new URLSearchParams(searchParams.toString())
    params.set('category', 'messages')
    params.set('thread', id)
    router.push(`/inbox?${params.toString()}`)
  }

  function closeThread() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('category', 'messages')
    params.delete('thread')
    window.history.replaceState({}, '', `/inbox?${params.toString()}`)
    router.replace(`/inbox?${params.toString()}`)
  }

  function handleMessageSent(msg: Message) {
    setThreadMessages((prev) => [...prev, msg])
    setThreads((prev) =>
      prev.map((t) =>
        t.id === msg.thread_id
          ? {
              ...t,
              last_message_at: msg.sent_at ?? msg.created_at,
              last_message_preview: msg.body.slice(0, 120),
              last_message_direction: 'outbound',
            }
          : t,
      ),
    )
  }

  function handleThreadCreated(thread: MessageThread, firstMessage: Message) {
    // Add thread to list, select it, exit compose mode
    setThreads((prev) => [thread, ...prev])
    setComposePatient(null)
    setThreadMessages([firstMessage])
    const params = new URLSearchParams(searchParams.toString())
    params.set('category', 'messages')
    params.set('thread', thread.id)
    router.replace(`/inbox?${params.toString()}`)
  }

  function isUnread(thread: MessageThread): boolean {
    return thread.last_message_direction === 'inbound' && !openedThreads.has(thread.id)
  }

  const showReadingPane = selectedThread || composePatient
  const effectiveReturnTo = returnTo ?? (patientMrn ? `/chart/${patientMrn}` : undefined)

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Message list */}
      <div
        className={cn(
          'flex flex-col overflow-hidden border-r border-border',
          showReadingPane ? 'w-80 shrink-0' : 'flex-1',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-background z-10">
          <span className="text-sm font-medium text-muted-foreground">
            {loadingThreads ? 'Loading…' : `${threads.length} threads`}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {loadingThreads ? (
            <div className="px-6 py-8 text-sm text-muted-foreground text-center">Loading messages…</div>
          ) : threads.length === 0 ? (
            <div className="px-6 py-8 text-sm text-muted-foreground text-center">No messages</div>
          ) : (
            threads.map((thread) => {
              const unread = isUnread(thread)
              const isSelected = thread.id === selectedThreadId
              return (
                <button
                  key={thread.id}
                  onClick={() => selectThread(thread.id)}
                  className={cn(
                    'w-full flex items-start gap-3 px-5 py-4 text-left transition-colors',
                    isSelected
                      ? 'bg-agent-tint border-l-2 border-accent pl-[18px]'
                      : 'hover:bg-muted/40',
                  )}
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full mt-1.5 shrink-0',
                      unread ? 'bg-accent' : 'bg-transparent',
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className={cn('text-sm truncate', unread ? 'font-semibold' : 'font-medium')}>
                        {thread.patient_name}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {thread.subject ?? '(no subject)'}
                    </p>
                    {thread.last_message_preview && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                        {thread.last_message_preview}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {thread.last_message_at ? formatRelativeTime(thread.last_message_at) : ''}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Reading pane — existing thread */}
      {selectedThread && (
        <MessageReadingPane
          thread={selectedThread}
          messages={loadingMessages ? [] : threadMessages}
          draft={activeDraft}
          focusTrigger={focusTrigger}
          onDraftChange={setDraft}
          onClose={closeThread}
          onMessageSent={handleMessageSent}
        />
      )}

      {/* New-compose pane — no existing thread */}
      {!selectedThread && composePatient && (
        <NewComposePane
          patient={composePatient}
          returnTo={effectiveReturnTo ?? `/chart/${composePatient.mrn}`}
          onClose={() => setComposePatient(null)}
          onThreadCreated={handleThreadCreated}
        />
      )}
    </div>
  )
}
