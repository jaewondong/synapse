import { LookupShell } from '@/components/synapse/lookup/lookup-shell'

export const metadata = {
  title: 'Patient lookup — Synapse',
}

export default function LookupPage() {
  return (
    <div className="min-h-full bg-chart-surface">
      <LookupShell />
    </div>
  )
}
