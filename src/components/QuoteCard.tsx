import { Quote as QuoteIcon } from 'lucide-react';

const QUOTES: { text: string; author: string }[] = [
  { text: 'The best way to predict the future is to invent it.', author: 'Alan Kay' },
  { text: 'Stay close to anything that makes you glad you are alive.', author: 'Hafez' },
  { text: 'We do not remember days, we remember moments.', author: 'Cesare Pavese' },
  { text: 'The quieter you become, the more you can hear.', author: 'Ram Dass' },
  { text: 'Almost everything will work again if you unplug it for a few minutes — including you.', author: 'Anne Lamott' },
  { text: 'Comparison is the thief of joy.', author: 'Theodore Roosevelt' },
  { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { text: 'Go confidently in the direction of your dreams.', author: 'Henry David Thoreau' },
  { text: 'Creativity is intelligence having fun.', author: 'Albert Einstein' },
  { text: 'You are never too old to set another goal or to dream a new dream.', author: 'C.S. Lewis' },
  { text: 'The journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
  { text: 'What we think, we become.', author: 'Buddha' },
];

function pickForToday(): { text: string; author: string } {
  // stable per-day quote based on date
  const day = Math.floor(Date.now() / 86_400_000);
  return QUOTES[day % QUOTES.length];
}

export function QuoteCard() {
  const q = pickForToday();
  return (
    <div
      className="card flex items-start gap-3 p-4"
      style={{ backgroundImage: 'linear-gradient(160deg, rgba(92,123,255,0.12) 0%, rgba(74,222,128,0.04) 100%)' }}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' }}
      >
        <QuoteIcon size={16} className="text-white" />
      </span>
      <div>
        <p className="text-sm font-medium leading-relaxed text-slate-100">"{q.text}"</p>
        <p className="mt-1.5 text-xs text-slate-500">— {q.author}</p>
      </div>
    </div>
  );
}
