import { Loader2, Users, Search } from 'lucide-react';
import { useState } from 'react';
import { useAllProfiles } from '../lib/hooks';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { Avatar } from '../components/Avatar';
import { AuraBadge } from '../components/AuraBadge';
import { cn, formatCount } from '../lib/utils';

export function BuddiesPage() {
  const { profiles, loading } = useAllProfiles();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');

  const filtered = profiles.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.username.toLowerCase().includes(q) ||
      (p.full_name ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <header className="mb-6 flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' }}
        >
          <Users size={18} className="text-white" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Buddies</h1>
          <p className="text-sm text-slate-500">
            {formatCount(profiles.length)} people on Hangout — tap anyone to view their profile.
          </p>
        </div>
      </header>

      <div className="relative mb-6 max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or username…"
          className="input pl-9"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-16 text-slate-500">
          <Loader2 className="animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="card p-10 text-center text-sm text-slate-500">
          {query ? 'No one matches that search.' : 'No buddies yet.'}
        </p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const isMe = user?.id === p.id;
            const name = p.full_name || p.username;
            return (
              <button
                key={p.id}
                onClick={() => navigate({ name: 'profile', userId: p.id })}
                className={cn(
                  'card group flex items-center gap-3 p-4 text-left transition-all hover:border-brand-400/40 hover:bg-white/5',
                )}
              >
                <Avatar url={p.avatar_url} name={name} size={48} ring />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-slate-100">{name}</p>
                    {isMe && (
                      <span className="rounded-full bg-brand-400/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand-300">
                        You
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">@{p.username}</p>
                </div>
                <AuraBadge auraPlus={p.aura_plus} auraMinus={p.aura_minus} size="sm" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
