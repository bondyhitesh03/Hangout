import { Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

type Props = {
  auraPlus: number;
  auraMinus: number;
  size?: 'sm' | 'md';
  className?: string;
};

export function AuraBadge({ auraPlus, auraMinus, size = 'md', className }: Props) {
  const total = (auraPlus ?? 0) - (auraMinus ?? 0);
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border border-white/5 px-3 py-2',
        size === 'sm' && 'px-2.5 py-1.5',
        className,
      )}
      style={{ backgroundImage: 'linear-gradient(135deg, rgba(92,123,255,0.10) 0%, rgba(74,222,128,0.04) 100%)' }}
    >
      <span
        className={cn('flex items-center justify-center rounded-lg', size === 'sm' ? 'h-6 w-6' : 'h-8 w-8')}
        style={{ backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' }}
      >
        <Sparkles size={size === 'sm' ? 12 : 16} className="text-white" />
      </span>
      <div className={cn(size === 'sm' && 'text-[10px]')}>
        <p className="text-[10px] uppercase tracking-wider text-slate-500">Aura</p>
        <p className={cn('font-semibold text-slate-100', size === 'sm' ? 'text-xs' : 'text-sm')}>{total}</p>
      </div>
    </div>
  );
}
