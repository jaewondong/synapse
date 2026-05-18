import { Suspense } from 'react'
import { InboxShell } from '@/components/synapse/inbox/inbox-shell'
import type { InboxCategory } from '@/components/synapse/inbox/category-rail'

interface PageProps {
  searchParams: Promise<{ category?: string }>
}

const validCategories: InboxCategory[] = [
  'agent-review',
  'messages',
  'results',
  'tasks',
  'signatures',
]

function isValidCategory(v: string | undefined): v is InboxCategory {
  return validCategories.includes(v as InboxCategory)
}

export default async function InboxPage({ searchParams }: PageProps) {
  const { category: raw } = await searchParams
  const category: InboxCategory = isValidCategory(raw) ? raw : 'agent-review'

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <Suspense>
        <InboxShell category={category} />
      </Suspense>
    </div>
  )
}
