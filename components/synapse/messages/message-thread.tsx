'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './message-bubble'
import type { Message } from './types'

interface MessageThreadProps {
  messages: Message[]
}

export function MessageThread({ messages }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        No messages in this thread.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      {/* Chronological: oldest at top */}
      {[...messages]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      <div ref={bottomRef} />
    </div>
  )
}
