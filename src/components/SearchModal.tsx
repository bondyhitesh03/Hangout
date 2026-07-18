import { useEffect, useRef, useState } from 'react';
import { Search as SearchIcon, X, Loader2, MessageSquareText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { Avatar } from './Avatar';
import type { Profile } from '../lib/types';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SearchModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const term = q.trim().toLowerCase();
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`)
        .limit(20);
      setResults((data ?? []) as Profile[]);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  if (!open) return null;

  const go = (p: Profile) => {
    onClose();
    navigate({ name: 'profile', userId: p.id });
  };

  const startDm = (p: Profile) => {
    onClose();
    navigate({ name: 'whisper-thread', userId: p.id });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh] animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg card overflow-hidden animate-rise">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <SearchIcon size={18} className="text-slate-500" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or username…"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
          <button onClick={onClose} className="btn-ghost p-1.5 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-8 text-slate-500">
              <Loader2 className="animate-spin" />
            </div>
          )}
          {!loading && q.trim() && results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500">No one found for "{q}".</p>
          )}
          {!loading && !q.trim() && (
            <p className="px-4 py-8 text-center text-sm text-slate-500">Start typing to find people on Hangout.</p>
          )}
          <div className="divide-y divide-white/5">
            {results.map((p) => {
              const isMe = p.id === user?.id;
              const name = p.full_name || p.username;
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5">
                  <button onClick={() => go(p)} className="flex flex-1 items-center gap-3 text-left">
                    <Avatar url={p.avatar_url} name={name} size={42} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-100">{name}</div>
                      <div className="truncate text-xs text-slate-500">@{p.username}</div>
                    </div>
                  </button>
                  {!isMe && (
                    <button
                      onClick={() => startDm(p)}
                      className="btn-outline !py-1.5 text-xs"
                      title="Whisper to this user"
                    >
                      <MessageSquareText size={14} /> Whisper
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
