import { useState } from 'react';
import { cn } from '../lib/utils';

const MOODS = [
  { emoji: '😄', label: 'Great', color: 'from-mint-400 to-mint-600' },
  { emoji: '🙂', label: 'Good', color: 'from-brand-300 to-brand-500' },
  { emoji: '😐', label: 'Okay', color: 'from-slate-400 to-slate-600' },
  { emoji: '😔', label: 'Low', color: 'from-amber-400 to-amber-600' },
] as const;

export function MoodCard() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="card p-4">
      <h3 className="mb-1 text-sm font-semibold text-slate-100">How are you feeling today?</h3>
      <p className="mb-3 text-xs text-slate-500">Tap a vibe — it sets the tone for your feed.</p>
      <div className="grid grid-cols-4 gap-2">
        {MOODS.map((m, i) => {
          const active = selected === i;
          return (
            <button
              key={m.label}
              onClick={() => setSelected(i)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 transition-all',
                active
                  ? 'border-transparent text-white shadow-glow scale-[1.03]'
                  : 'border-white/5 bg-ink-900/40 text-slate-400 hover:bg-white/5 hover:text-slate-200',
              )}
              style={active ? { backgroundImage: `linear-gradient(135deg, ${i % 2 === 0 ? '#5c7bff, #4ade80' : '#4ade80, #5c7bff'})` } : undefined}
            >
              <span className="text-2xl leading-none">{m.emoji}</span>
              <span className="text-[10px] font-medium">{m.label}</span>
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <p className="mt-3 text-center text-xs text-slate-400 animate-fade-in">
          Feeling <span className="font-semibold text-brand-300">{MOODS[selected].label}</span> today. Hangout's got you.
        </p>
      )}
    </div>
  );
}
