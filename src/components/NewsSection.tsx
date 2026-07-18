import { useMemo, useState } from 'react';
import { Newspaper, ExternalLink } from 'lucide-react';
import { useNews } from '../lib/hooks';
import { timeAgo, cn } from '../lib/utils';

const CATEGORIES = ['All', 'Technology', 'Business', 'Sports', 'Science', 'Entertainment', 'World'] as const;

export function NewsSection() {
  const { items, loading } = useNews();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('All');

  const filtered = useMemo(() => {
    if (cat === 'All') return items;
    return items.filter((i) => i.category === cat);
  }, [items, cat]);

  return (
    <section className="card overflow-hidden">
      <header className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' }}
        >
          <Newspaper size={15} className="text-white" />
        </span>
        <h2 className="text-sm font-semibold text-slate-100">Latest News</h2>
        <span className="ml-auto chip">{filtered.length} stories</span>
      </header>

      <div className="flex gap-1.5 overflow-x-auto px-4 py-3">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all',
              cat === c
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200 border border-white/5 bg-white/5',
            )}
            style={
              cat === c
                ? { backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' }
                : undefined
            }
          >
            {c}
          </button>
        ))}
      </div>

      <div className="max-h-[520px] divide-y divide-white/5 overflow-y-auto">
        {loading && (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-14 w-14 shrink-0 rounded-lg bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-3/4 rounded bg-white/5 animate-pulse" />
                  <div className="h-2.5 w-1/2 rounded bg-white/5 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-xs text-slate-500">No stories in this category.</p>
        )}
        {filtered.map((n) => (
          <a
            key={n.id}
            href={n.url ?? '#'}
            target="_blank"
            rel="noreferrer noopener"
            className="group flex gap-3 px-4 py-3 transition-colors hover:bg-white/5"
          >
            {n.image_url ? (
              <img
                src={n.image_url}
                alt={n.title}
                loading="lazy"
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="h-14 w-14 shrink-0 rounded-lg bg-ink-700" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="chip !py-0.5 !text-[10px] !text-brand-200 !border-brand-400/20 !bg-brand-400/10">
                  {n.category}
                </span>
                <span className="text-[10px] text-slate-500">{timeAgo(n.published_at)}</span>
              </div>
              <h3 className="mt-1 line-clamp-2 text-sm font-medium text-slate-100 group-hover:text-brand-200">
                {n.title}
              </h3>
              {n.summary && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{n.summary}</p>}
              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-600">
                <span>{n.source}</span>
                <ExternalLink size={10} />
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
