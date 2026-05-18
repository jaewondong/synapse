'use client';

import { X, BookOpen, GitBranch, Database } from 'lucide-react';
import type { InboxItem } from '@/lib/types';
import ConfidenceDots from './ConfidenceDots';

interface ExplainabilityDrawerProps {
  item: InboxItem | null;
  onClose: () => void;
}

export default function ExplainabilityDrawer({ item, onClose }: ExplainabilityDrawerProps) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/20 z-30 transition-opacity duration-300 lg:hidden ${item ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-[400px] max-w-full bg-white shadow-xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${item ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-indigo-500 font-bold">◇</span>
            <h2 className="text-sm font-semibold text-gray-900">Agent Reasoning</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {item && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-wide font-semibold text-gray-400 flex items-center gap-1.5">
                <GitBranch size={12} />
                Decision
              </p>
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-600">{item.summary}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">Confidence:</span>
                <ConfidenceDots confidence={item.confidence} />
                <span className="text-xs text-gray-400 ml-1">({Math.round(item.confidence * 100)}%)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-wide font-semibold text-gray-400 flex items-center gap-1.5">
                <BookOpen size={12} />
                Why
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{item.reasoning}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide font-semibold text-gray-400 flex items-center gap-1.5">
                <Database size={12} />
                Inputs & Sources
              </p>
              <ul className="space-y-1">
                {item.sources.map((source, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                    {source}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-1">
              <p className="text-xs uppercase tracking-wide font-semibold text-gray-400">Details</p>
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Agent</span>
                  <span className="font-medium text-gray-700">{item.agentName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Patient</span>
                  <span className="font-medium text-gray-700">{item.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Priority</span>
                  <span className="font-medium text-gray-700 capitalize">{item.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span>SLA</span>
                  <span className="font-medium text-gray-700">{item.slaMinutes} min</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
