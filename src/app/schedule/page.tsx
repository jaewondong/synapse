import { Calendar } from 'lucide-react';

export default function SchedulePage() {
  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-2 mb-1">
        <Calendar size={20} className="text-gray-400" />
        <h1 className="text-lg font-bold text-gray-900">Schedule</h1>
      </div>
      <p className="text-sm text-gray-400">This section is coming soon.</p>
    </div>
  );
}
