import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Loader2, MessageSquareText, Search } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Avatar';
import { useDmThreads, useDmMessages, findOrCreateThread } from '../lib/hooks';
import { timeAgo, cn } from '../lib/utils';
import type { DmMessageWithProfile, Profile } from '../lib/types';

export function WhisperPage() {
  const { navigate } = useRouter();
  const { threads, loading } = useDmThreads();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
      <header className="mb-5 flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' }}
        >
          <MessageSquareText size={18} className="text-white" />
        </span>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-100">Whisper</h1>
          <p className="text-sm text-slate-500">Private conversations, just between you two.</p>
        </div>
      </header>

      <div className="card overflow-hidden">
        {loading && (
          <div className="flex justify-center py-10 text-slate-500">
            <Loader2 className="animate-spin" />
          </div>
        )}
        {!loading && threads.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <p className="text-sm text-slate-400">No conversations yet.</p>
            <p className="text-xs text-slate-600">Search for someone to start whispering.</p>
            <button onClick={() => navigate({ name: 'explore' })} className="btn-outline mt-2">
              <Search size={15} /> Find people
            </button>
          </div>
        )}
        <div className="divide-y divide-white/5">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate({ name: 'whisper-thread', userId: t.other.id })}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
            >
              <Avatar url={t.other.avatar_url} name={t.other.username} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-slate-100">
                    {t.other.full_name || t.other.username}
                  </span>
                  {t.last_at && <span className="shrink-0 text-[10px] text-slate-500">{timeAgo(t.last_at)}</span>}
                </div>
                <p className="truncate text-xs text-slate-500">
                  {t.last_message ?? 'Say hello 👋'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WhisperThreadPage({ userId }: { userId: string }) {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [other, setOther] = useState<Profile | null>(null);
  const { messages, loading, reload } = useDmMessages(threadId);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || user.id === userId) return;
    (async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      setOther(prof as Profile | null);
      const id = await findOrCreateThread(user.id, userId);
      setThreadId(id);
    })();
  }, [user, userId]);

  useEffect(() => {
    if (!threadId) return;
    reload();
    const ch = supabase
      .channel(`dm-${threadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dm_messages', filter: `thread_id=eq.${threadId}` },
        () => reload(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [threadId, reload]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!user || !threadId || !draft.trim()) return;
    setBusy(true);
    await supabase.from('dm_messages').insert({ thread_id: threadId, sender_id: user.id, content: draft.trim() });
    setDraft('');
    setBusy(false);
    reload();
  };

  const otherName = other?.full_name || other?.username || 'user';

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
      <header className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate({ name: 'whisper' })} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <Avatar url={other?.avatar_url} name={otherName} size={40} />
        <div>
          <h1 className="text-base font-semibold text-slate-100">{otherName}</h1>
          <p className="text-xs text-slate-500">@{other?.username ?? 'user'}</p>
        </div>
      </header>

      <div className="card flex h-[68vh] flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {loading && (
            <div className="flex h-full items-center justify-center text-slate-500">
              <Loader2 className="animate-spin" />
            </div>
          )}
          {!loading && messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm text-slate-400">No messages yet.</p>
              <p className="text-xs text-slate-600">Whisper something to start the conversation.</p>
            </div>
          )}
          {messages.map((m: DmMessageWithProfile) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div className="flex items-end gap-2 max-w-[78%]">
                  {!mine && <Avatar url={m.profiles.avatar_url} name={m.profiles.username} size={26} />}
                  <div
                    className={cn(
                      'rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                      mine ? 'rounded-br-sm text-white' : 'rounded-bl-sm bg-ink-800 text-slate-200',
                    )}
                    style={mine ? { backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' } : undefined}
                  >
                    {m.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-2">
            <Avatar url={profile?.avatar_url} name={profile?.username ?? 'me'} size={30} />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Whisper something…"
              className="input !py-2"
            />
            <button onClick={send} disabled={busy || !draft.trim() || !threadId} className="btn-primary !px-3 !py-2.5">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
