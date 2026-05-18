interface StatCardProps {
  label: string
  value: number
  subline: string
}

function StatCard({ label, value, subline }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 flex flex-col justify-center h-20">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-3xl font-semibold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground truncate text-right">{subline}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

interface QuickStatsProps {
  unsignedNotes: number
  unsignedNotesFromYesterday: number
  openTasks: number
  openTasksOverdue: number
  messagesAwaiting: number
  messagesUrgent: number
}

export function QuickStats({
  unsignedNotes,
  unsignedNotesFromYesterday,
  openTasks,
  openTasksOverdue,
  messagesAwaiting,
  messagesUrgent,
}: QuickStatsProps) {
  return (
    <div className="flex flex-col gap-3">
      <StatCard
        label="Unsigned notes"
        value={unsignedNotes}
        subline={`${unsignedNotesFromYesterday} from yesterday`}
      />
      <StatCard
        label="Open tasks"
        value={openTasks}
        subline={`${openTasksOverdue} overdue`}
      />
      <StatCard
        label="Messages awaiting reply"
        value={messagesAwaiting}
        subline={`${messagesUrgent} urgent`}
      />
    </div>
  )
}
