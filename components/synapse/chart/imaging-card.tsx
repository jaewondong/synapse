import * as React from 'react'
import { ScanLine, ExternalLink } from 'lucide-react'
import type { ImagingStudy } from '@/lib/types/chart'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface ImagingCardProps {
  studies: ImagingStudy[]
}

export function ImagingCard({ studies }: ImagingCardProps) {
  const recent = studies.slice(0, 5)

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-4 py-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <ScanLine className="h-[18px] w-[18px]" aria-hidden />
        <span className="text-[15px] font-medium">Imaging</span>
      </div>

      {recent.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">No imaging studies on record</p>
      ) : (
        <div>
          {recent.map((s, i) => (
            <div
              key={s.id}
              className={`flex justify-between items-start py-2 text-[13px] ${i < recent.length - 1 ? 'border-b border-black/[0.06]' : ''}`}
            >
              <div className="min-w-0 mr-4">
                <p className="font-medium truncate">{s.type}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatDate(s.date)} · {s.provider}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 italic">{s.result}</p>
              </div>
              {s.status === 'complete' && (
                <button
                  className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors mt-0.5"
                  aria-label={`Open ${s.type}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TODO: labs/documents cards */}
    </div>
  )
}
