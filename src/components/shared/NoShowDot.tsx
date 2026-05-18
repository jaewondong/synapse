import type { NoShowRisk } from '@/lib/types';
import { clsx } from 'clsx';

const riskConfig: Record<NoShowRisk, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-400',
  high: 'bg-red-500',
};

interface NoShowDotProps {
  risk: NoShowRisk;
}

export default function NoShowDot({ risk }: NoShowDotProps) {
  return (
    <span
      className={clsx('inline-block w-2 h-2 rounded-full', riskConfig[risk])}
      title={`No-show risk: ${risk}`}
    />
  );
}
