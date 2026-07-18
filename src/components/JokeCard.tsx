import { useState } from 'react';
import { Laugh, RefreshCw, Sparkles } from 'lucide-react';
import { useJokes } from '../lib/hooks';

export function JokeCard() {
  const { joke, loading, refresh } = useJokes();
  const [revealed, setRevealed] = useState(false);

  const next = () => {
    setRevealed(false);
    refresh();
  };

  if (loading || !joke) {
    return (
      <div className="card p-4">
        <div className="h-4 w-1/2 rounded bg-white/5 animate-pulse" />
        <div className="mt-2 h-3 w-2/3 rounded bg-white/5 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className="card overflow-hidden p-4"
      style={{ backgroundImage: 'linear-gradient(160deg, rgba(92,123,255,0.10) 0%, rgba(74,222,128,0.05) 100%)' }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' }}
        >
          <Laugh size={15} className="text-white" />
        </span>
        <h3 className="text-sm font-semibold text-slate-100">Daily Chuckle</h3>
        <button
          onClick={next}
          className="ml-auto rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-brand-300"
          title="Another joke"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      <p className="text-sm leading-relaxed text-slate-200">{joke.setup}</p>
      {revealed ? (
        <p
          className="mt-2 text-sm font-medium leading-relaxed text-transparent bg-clip-text animate-fade-in"
          style={{ backgroundImage: 'linear-gradient(135deg, #8fa6ff 0%, #4ade80 100%)' }}
        >
          {joke.punchline}
        </p>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-300 hover:text-brand-200"
        >
          <Sparkles size={13} /> Reveal punchline
        </button>
      )}
    </div>
  );
}
