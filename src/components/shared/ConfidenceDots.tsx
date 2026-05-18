'use client';

interface ConfidenceDotsProps {
  confidence: number;
}

export default function ConfidenceDots({ confidence }: ConfidenceDotsProps) {
  const isHigh = confidence >= 0.85;
  const isMedium = confidence >= 0.65;

  if (isHigh) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex gap-0.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
        <span className="text-xs text-emerald-600 font-medium">High</span>
      </div>
    );
  }

  if (isMedium) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex gap-0.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="w-2 h-2 rounded-full border border-gray-300" />
        </div>
        <span className="text-xs text-amber-600 font-medium">Medium</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span className="w-2 h-2 rounded-full border border-gray-300" />
        <span className="w-2 h-2 rounded-full border border-gray-300" />
      </div>
      <span className="text-xs text-red-600 font-medium">Low</span>
    </div>
  );
}
