'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckSquare, CheckCheck, Inbox } from 'lucide-react';
import { clsx } from 'clsx';
import { inboxItems as initialItems } from '@/lib/mock-data';
import type { InboxCategory, InboxItem } from '@/lib/types';
import AgentCard from '@/components/shared/AgentCard';
import ExplainabilityDrawer from '@/components/shared/ExplainabilityDrawer';

const categoryTabs: { label: string; value: InboxCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Eligibility', value: 'eligibility' },
  { label: 'Messages', value: 'message' },
  { label: 'Prior Auth', value: 'prior-auth' },
  { label: 'Documents', value: 'document' },
  { label: 'Coding', value: 'coding' },
  { label: 'Scheduling', value: 'scheduling' },
];

export default function InboxView() {
  const [items, setItems] = useState<InboxItem[]>(
    [...initialItems].sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    }),
  );
  const [activeCategory, setActiveCategory] = useState<InboxCategory | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [reasoningItem, setReasoningItem] = useState<InboxItem | null>(null);

  const pendingItems = items.filter((i) => i.status === 'pending');
  const visibleItems = pendingItems.filter(
    (i) => activeCategory === 'all' || i.category === activeCategory,
  );

  const focusedIndexRef = useRef(focusedIndex);
  focusedIndexRef.current = focusedIndex;

  const handleApprove = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'approved' } : i)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleReject = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'rejected' } : i)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleBulkApprove = () => {
    setItems((prev) =>
      prev.map((i) =>
        selectedIds.has(i.id) && i.status === 'pending' ? { ...i, status: 'approved' } : i,
      ),
    );
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleItems.length && visibleItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleItems.map((i) => i.id)));
    }
  };

  const categoryCounts = (cat: InboxCategory | 'all') => {
    if (cat === 'all') return pendingItems.length;
    return pendingItems.filter((i) => i.category === cat).length;
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, visibleItems.length - 1));
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'a' || e.key === 'A') {
        const item = visibleItems[focusedIndexRef.current];
        if (item) handleApprove(item.id);
      } else if (e.key === 'r' || e.key === 'R') {
        const item = visibleItems[focusedIndexRef.current];
        if (item) handleReject(item.id);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visibleItems, handleApprove, handleReject]);

  useEffect(() => {
    setFocusedIndex(0);
  }, [activeCategory]);

  const allSelected = visibleItems.length > 0 && selectedIds.size === visibleItems.length;

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 pt-6 pb-0 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-gray-900">Inbox</h1>
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkApprove}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <CheckCheck size={15} />
                Bulk Approve ({selectedIds.size})
              </button>
            )}
          </div>

          <div className="flex gap-1 overflow-x-auto pb-px">
            {categoryTabs.map(({ label, value }) => {
              const count = categoryCounts(value);
              return (
                <button
                  key={value}
                  onClick={() => setActiveCategory(value)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                    activeCategory === value
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700',
                  )}
                >
                  {label}
                  <span
                    className={clsx(
                      'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                      activeCategory === value
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-500',
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-4 text-sm text-gray-500">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 hover:text-gray-700 transition-colors"
          >
            <CheckSquare
              size={15}
              className={allSelected ? 'text-indigo-600' : 'text-gray-400'}
            />
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          <span className="text-gray-300">|</span>
          <span className="font-medium text-gray-700">{visibleItems.length} items remaining</span>
          {visibleItems.length > 0 && (
            <span className="text-xs text-gray-400 ml-auto">
              J/K navigate · A approve · R reject
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <Inbox size={28} className="text-emerald-500" />
              </div>
              <p className="text-base font-semibold text-gray-900">You&apos;re all caught up.</p>
              <p className="text-sm text-gray-400 mt-1">Agents are working on the next batch.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleItems.map((item, idx) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="mt-4 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <AgentCard
                      item={item}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onShowReasoning={setReasoningItem}
                      isSelected={selectedIds.has(item.id)}
                      isFocused={idx === focusedIndex}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ExplainabilityDrawer item={reasoningItem} onClose={() => setReasoningItem(null)} />
    </div>
  );
}
