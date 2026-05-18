'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { inboxItems, autoCompletedItems } from '@/lib/mock-data';
import type { InboxCategory, InboxItem } from '@/lib/types';
import AgentCard from '@/components/shared/AgentCard';
import ExplainabilityDrawer from '@/components/shared/ExplainabilityDrawer';

const categoryFilters: { label: string; value: InboxCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Eligibility', value: 'eligibility' },
  { label: 'Messages', value: 'message' },
  { label: 'Documents', value: 'document' },
  { label: 'Tasks', value: 'coding' },
];

const categoryGlyph: Record<string, string> = {
  eligibility: 'Eligibility Agent',
  message: 'Triage Agent',
  'prior-auth': 'Prior Auth Agent',
  document: 'Document Agent',
  coding: 'Coding Agent',
  scheduling: 'Scheduling Agent',
  'no-show': 'Scheduling Agent',
};

export default function TodayView() {
  const [items, setItems] = useState<InboxItem[]>(
    [...inboxItems].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }),
  );
  const [activeFilter, setActiveFilter] = useState<InboxCategory | 'all'>('all');
  const [autoExpanded, setAutoExpanded] = useState(false);
  const [reasoningItem, setReasoningItem] = useState<InboxItem | null>(null);

  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const messageCount = items.filter((i) => i.category === 'message' && i.status === 'pending').length;

  const handleApprove = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'approved' } : i)));
  };

  const handleReject = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'rejected' } : i)));
  };

  const filtered = items
    .filter((i) => i.status === 'pending')
    .filter((i) => activeFilter === 'all' || i.category === activeFilter)
    .slice(0, 6);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Good morning, Alex.</h1>
          <p className="text-sm text-gray-500 mt-0.5">Here&apos;s your day.</p>
        </div>
        <p className="text-sm text-gray-400 font-medium mt-1">{dateStr}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-7">
        <Link
          href="/inbox"
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm hover:border-indigo-200 transition-all group"
        >
          <p className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {pendingCount}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Pending Reviews</p>
        </Link>
        <Link
          href="/inbox?category=message"
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm hover:border-indigo-200 transition-all group"
        >
          <p className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {messageCount}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Patient Messages</p>
        </Link>
        <Link
          href="/schedule"
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm hover:border-indigo-200 transition-all group"
        >
          <p className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
            8
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Today&apos;s Appointments</p>
        </Link>
      </div>

      <div className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Things waiting on you
          </h2>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {categoryFilters.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setActiveFilter(value)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
                activeFilter === value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((item) => (
            <AgentCard
              key={item.id}
              item={item}
              onApprove={handleApprove}
              onReject={handleReject}
              onShowReasoning={setReasoningItem}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No pending items in this category.
            </div>
          )}
        </div>

        {pendingCount > 6 && (
          <Link
            href="/inbox"
            className="flex items-center gap-1 mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View all {pendingCount} items in Inbox
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      <div className="border-t border-gray-200 pt-5">
        <button
          onClick={() => setAutoExpanded((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
        >
          {autoExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          Auto-completed today
          <span className="ml-1 text-xs font-normal text-gray-400">
            {autoCompletedItems.length} items handled automatically
          </span>
        </button>

        {autoExpanded && (
          <ul className="mt-3 space-y-2">
            {autoCompletedItems.map((ac) => (
              <li key={ac.id} className="flex items-start gap-2 text-sm text-gray-600 py-1.5">
                <span className="text-indigo-400 font-bold text-xs mt-0.5 select-none">◇</span>
                <div className="min-w-0">
                  <span className="text-xs uppercase tracking-wide font-semibold text-gray-400 mr-2">
                    {categoryGlyph[ac.category] ?? ac.agentName}
                  </span>
                  {ac.description}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ExplainabilityDrawer item={reasoningItem} onClose={() => setReasoningItem(null)} />
    </div>
  );
}
