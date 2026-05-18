'use client'

import { Suspense } from 'react'
import { CategoryRail, type InboxCategory } from './category-rail'
import { AgentReviewList, AgentReviewListSkeleton } from './agent-review-list'
import {
  CategoryStubList,
  messagesToRows,
  resultsToRows,
  tasksToRows,
  signaturesToRows,
} from './category-stub-list'
import { allAgentActions } from '@/lib/mock/agent-actions'
import {
  mockMessages,
  mockResults,
  mockTasks,
  mockSignatures,
  mockInboxCounts,
} from '@/lib/mock/inbox'

interface InboxShellProps {
  category: InboxCategory
}

const counts = {
  'agent-review': mockInboxCounts.agentReview,
  messages: mockInboxCounts.messages,
  results: mockInboxCounts.results,
  tasks: mockInboxCounts.tasks,
  signatures: mockInboxCounts.signatures,
}

const totalUnread =
  mockInboxCounts.agentReview +
  mockInboxCounts.messages +
  mockInboxCounts.results +
  mockInboxCounts.tasks +
  mockInboxCounts.signatures

export function InboxShell({ category }: InboxShellProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalUnread} pending
              <span className="mx-1.5 text-muted-foreground/40">·</span>
              <span>{mockInboxCounts.agentReview} need review</span>
              <span className="mx-1.5 text-muted-foreground/40">·</span>
              <span>{mockInboxCounts.messages} messages</span>
              <span className="mx-1.5 text-muted-foreground/40">·</span>
              <span>{mockInboxCounts.results} results</span>
              <span className="mx-1.5 text-muted-foreground/40">·</span>
              <span>{mockInboxCounts.tasks} tasks</span>
              <span className="mx-1.5 text-muted-foreground/40">·</span>
              <span>{mockInboxCounts.signatures} signature{mockInboxCounts.signatures !== 1 ? 's' : ''}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Mark all as read
            </button>
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={null}>
          <CategoryRail active={category} counts={counts} />
        </Suspense>

        {/* Right pane */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {category === 'agent-review' && (
            <Suspense fallback={<AgentReviewListSkeleton />}>
              <AgentReviewList
                actions={allAgentActions}
                totalCount={mockInboxCounts.agentReview}
              />
            </Suspense>
          )}

          {category === 'messages' && (
            <CategoryStubList
              categoryLabel="Messages"
              rows={messagesToRows(mockMessages)}
              totalCount={mockInboxCounts.messages}
            />
          )}

          {category === 'results' && (
            <CategoryStubList
              categoryLabel="Results"
              rows={resultsToRows(mockResults)}
              totalCount={mockInboxCounts.results}
            />
          )}

          {category === 'tasks' && (
            <CategoryStubList
              categoryLabel="Tasks"
              rows={tasksToRows(mockTasks)}
              totalCount={mockInboxCounts.tasks}
            />
          )}

          {category === 'signatures' && (
            <CategoryStubList
              categoryLabel="Signatures"
              rows={signaturesToRows(mockSignatures)}
              totalCount={mockInboxCounts.signatures}
            />
          )}
        </div>
      </div>
    </div>
  )
}
