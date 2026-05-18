import { BarChart2 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-2 mb-1">
        <BarChart2 size={20} className="text-gray-400" />
        <h1 className="text-lg font-bold text-gray-900">Reports</h1>
      </div>
      <p className="text-sm text-gray-400">This section is coming soon.</p>
    </div>
  );
}
