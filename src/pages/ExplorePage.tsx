import { Loader2, Compass } from 'lucide-react';
import { useAllPosts } from '../lib/hooks';
import { PostCard } from '../components/PostCard';
import { useState } from 'react';
import { cn } from '../lib/utils';

const FILTERS = ['All', 'Photos', 'Videos'] as const;

export function ExplorePage() {
  const { posts, loading } = useAllPosts();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const filtered = posts.filter((p) =>
    filter === 'All' ? true : filter === 'Photos' ? p.media_type === 'photo' : p.media_type === 'video',
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <header className="mb-6 flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' }}
        >
          <Compass size={18} className="text-white" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Explore</h1>
          <p className="text-sm text-slate-500">Discover posts from across Hangout.</p>
        </div>
      </header>

      <div className="mb-5 flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
              filter === f
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200 border border-white/5 bg-white/5',
            )}
            style={filter === f ? { backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' } : undefined}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16 text-slate-500">
          <Loader2 className="animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="card p-10 text-center text-sm text-slate-500">Nothing here yet.</p>
      )}

      {/* Masonry-ish grid */}
      {filtered.length > 0 && (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [column-fill:_balance]">
          {filtered.map((p) => (
            <div key={p.id} className="mb-5 break-inside-avoid">
              <PostCard post={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
