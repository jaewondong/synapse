import { getPendingInsuranceDocuments } from '@/lib/db/insurance'
import { BillingShell } from '@/components/synapse/billing/billing-shell'

// The verification queue must reflect live DB state, not a build-time snapshot.
export const dynamic = 'force-dynamic'

// Billing workspace — hosts the Insurance Document Agent (§2.6) with a
// cross-patient verification queue and a patient picker.
export default async function BillingPage() {
  const pendingDocuments = await getPendingInsuranceDocuments()

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-4">
      <div className="rounded-xl bg-chart-surface p-4 space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-black/[0.08] bg-white px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Billing</p>
            <p className="text-[11px] text-muted-foreground">
              Insurance documents · agent-extracted, human-verified
            </p>
          </div>
          <p className="text-[11px] text-chart-subtle">⌁ Insurance Agent</p>
        </div>

        <BillingShell pendingDocuments={pendingDocuments} />
      </div>
    </div>
  )
}
