'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Inbox,
  Calendar,
  Users,
  FileText,
  CreditCard,
  Bot,
  BarChart2,
  Settings,
} from 'lucide-react';
import { clsx } from 'clsx';
import { inboxItems } from '@/lib/mock-data';

const pendingCount = inboxItems.filter((i) => i.status === 'pending').length;

const navItems = [
  { label: 'Today', href: '/', icon: Home },
  { label: 'Inbox', href: '/inbox', icon: Inbox, badge: pendingCount },
  { label: 'Schedule', href: '/schedule', icon: Calendar },
  { label: 'Patients', href: '/patients', icon: Users },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'Agents', href: '/agents', icon: Bot, badge: 3 },
  { label: 'Reports', href: '/reports', icon: BarChart2 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] min-h-screen bg-slate-900 flex flex-col flex-shrink-0">
      <div className="px-4 py-5 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="text-indigo-400 text-xl font-bold">◇</span>
          <span className="text-white font-bold text-lg tracking-tight">Synapse</span>
        </div>
        <p className="text-slate-400 text-xs mt-0.5">AI-Native EMR</p>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )}
            >
              <Icon
                size={18}
                className={clsx(isActive ? 'text-white' : 'text-slate-400 group-hover:text-white')}
              />
              <span className="flex-1">{label}</span>
              {badge !== undefined && badge > 0 && (
                <span
                  className={clsx(
                    'text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                    isActive ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-200',
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-3 border-t border-slate-700/60 pt-3">
        <Link
          href="/admin"
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group',
            pathname === '/admin'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white',
          )}
        >
          <Settings
            size={18}
            className={clsx(
              pathname === '/admin' ? 'text-white' : 'text-slate-400 group-hover:text-white',
            )}
          />
          <span>Admin</span>
        </Link>
      </div>
    </aside>
  );
}
