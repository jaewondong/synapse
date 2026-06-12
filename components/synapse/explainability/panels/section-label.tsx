export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
      {children}
    </p>
  )
}
