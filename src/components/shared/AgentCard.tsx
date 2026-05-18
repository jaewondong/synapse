'use client';

import { clsx } from 'clsx';
import { MoreHorizontal, Pencil } from 'lucide-react';
import type { InboxItem } from '@/lib/types';
import ConfidenceDots from './ConfidenceDots';

interface AgentCardProps {
  item: InboxItem;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit?: (id: string) => void;
  onShowReasoning?: (item: InboxItem) => void;
  isSelected?: boolean;
  isFocused?: boolean;
}

const categoryLabel: Record<string, string> = {
  eligibility: 'Eligibility',
  message: 'Message',
  'prior-auth': 'Prior Auth',
  document: 'Document',
  coding: 'Coding',
  scheduling: 'Scheduling',
  'no-show': 'No-Show Risk',
};

const priorityDot: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-gray-300',
};

export default function AgentCard({
  item,
  onApprove,
  onReject,
  onEdit,
  onShowReasoning,
  isSelected,
  isFocused,
}: AgentCardProps) {
  const isDone = item.status === 'approved' || item.status === 'rejected';

  return (
    <div
      className={clsx(
        'bg-white rounded-lg border shadow-sm p-4 transition-all duration-300',
        isFocused ? 'ring-2 ring-indigo-500 border-indigo-300' : 'border-gray-200',
        isDone && 'opacity-40',
        isSelected && 'bg-indigo-50 border-indigo-200',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-indigo-500 text-sm font-bold select-none">◇</span>
          <span className="text-xs uppercase tracking-wide font-semibold text-gray-400 truncate">
            {item.agentName}
          </span>
          <span className="text-gray-300 text-xs">·</span>
          <span className="text-xs text-gray-400">{categoryLabel[item.category] ?? item.category}</span>
          {item.priority === 'high' && (
            <span className={clsx('w-1.5 h-1.5 rounded-full ml-0.5 flex-shrink-0', priorityDot[item.priority])} />
          )}
        </div>
        <div className="flex-shrink-0">
          <ConfidenceDots confidence={item.confidence} />
        </div>
      </div>

      <div className="mt-2">
        <p className="font-semibold text-sm text-gray-900">{item.patientName}</p>
        <p className="text-sm text-gray-700 mt-0.5 leading-snug">{item.summary}</p>
      </div>

      {item.sources.length > 0 && (
        <p className="text-xs text-gray-400 mt-1.5 truncate">
          Sources: {item.sources.slice(0, 2).join(' · ')}
          {item.sources.length > 2 && ` +${item.sources.length - 2} more`}
        </p>
      )}

      <div className="flex items-center gap-2 mt-3">
        {!isDone ? (
          <>
            <button
              onClick={() => onApprove(item.id)}
              className="px-3 py-1 rounded text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => onEdit?.(item.id)}
              className="px-3 py-1 rounded text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-1">
                <Pencil size={11} />
                Edit
              </span>
            </button>
            <button
              onClick={() => onReject(item.id)}
              className="px-3 py-1 rounded text-xs font-medium border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => onShowReasoning?.(item)}
              className="px-3 py-1 rounded text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors ml-auto"
            >
              Why?
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <MoreHorizontal size={15} />
            </button>
          </>
        ) : (
          <span className={clsx(
            'text-xs font-medium px-2 py-0.5 rounded',
            item.status === 'approved'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700',
          )}>
            {item.status === 'approved' ? 'Approved' : 'Rejected'}
          </span>
        )}
      </div>
    </div>
  );
}
