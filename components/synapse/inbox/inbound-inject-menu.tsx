'use client'

// Synapse §2.9 §4.2 — dev-only trigger to inject an inbound fixture as if it just
// arrived (zero external setup, mock adapter). Hidden when the live resend
// adapter is configured.
import { useState } from 'react'
import { Inbox as InboxIcon, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { INBOUND_FIXTURES } from '@/lib/mock/inbound-fixtures'
import { injectFixture } from './inbound-api'
import type { InboundEmailRecord } from '@/lib/inbound/InboundEmail'

export function InboundInjectMenu({
  onInjected,
}: {
  onInjected: (record: InboundEmailRecord) => void
}) {
  const [busy, setBusy] = useState(false)

  // Only meaningful against the mock adapter (the dev default).
  if (process.env.NEXT_PUBLIC_INBOUND_ADAPTER === 'resend') return null

  async function inject(key: string) {
    setBusy(true)
    try {
      const rec = await injectFixture(key)
      onInjected(rec)
      toast.success('Inbound email received')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Inject failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
        >
          <InboxIcon className="h-3.5 w-3.5" />
          Simulate inbound
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {INBOUND_FIXTURES.map((f) => (
          <DropdownMenuItem key={f.key} onSelect={() => inject(f.key)} className="text-xs">
            {f.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
