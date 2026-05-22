import { Suspense } from 'react'
import { InboxShell } from '@/components/synapse/inbox/inbox-shell'
import type { InboxCategory } from '@/components/synapse/inbox/category-rail'

interface PageProps {
  searchParams: Promise<{
    category?: string
    thread?: string
    patient_mrn?: string
    compose?: string
    return_to?: string
  }>
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
  const { category: raw, thread, patient_mrn, compose, return_to } = await searchParams

  // If patient_mrn is present, force the messages tab
  const category: InboxCategory =
    patient_mrn ? 'messages' : isValidCategory(raw) ? raw : 'agent-review'

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <Suspense>
        <InboxShell
          category={category}
          selectedThreadId={thread ?? null}
          patientMrn={patient_mrn ?? null}
          compose={compose ?? null}
          returnTo={return_to ?? null}
        />
      </Suspense>
    </div>
  )
}
