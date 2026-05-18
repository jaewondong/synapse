import type { AppointmentStatus } from '@/lib/types';
import { clsx } from 'clsx';

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmed', className: 'bg-indigo-100 text-indigo-700' },
  'checked-in': { label: 'Checked In', className: 'bg-green-100 text-green-700' },
  'in-room': { label: 'In Room', className: 'bg-emerald-100 text-emerald-700' },
  complete: { label: 'Complete', className: 'bg-gray-100 text-gray-600' },
  'no-show': { label: 'No Show', className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500' },
};

interface StatusPillProps {
  status: AppointmentStatus;
}

export default function StatusPill({ status }: StatusPillProps) {
  const { label, className } = statusConfig[status];
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', className)}>
      {label}
    </span>
  );
}
