import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, MessageSquareText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Avatar } from '../components/Avatar';
import { timeAgo, cn } from '../lib/utils';
import type { YapMessageWithProfile } from '../lib/types';

export function YapPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<YapMessageWithProfile[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from('yap_messages')
      .select('id, user_id, content, created_at, profiles!yap_messages_user_id_fkey(id, username, avatar_url)')
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages((data ?? []) as unknown as YapMessageWithProfile[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('yap-room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'yap_messages' }, async () => {
        await load();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!user || !draft.trim()) return;
    setBusy(true);
    await supabase.from('yap_messages').insert({ user_id: user.id, content: draft.trim() });
    setDraft('');
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
      <header className="mb-5 flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' }}
        >
          <MessageSquareText size={18} className="text-white" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Yap</h1>
          <p className="text-sm text-slate-500">A global room — be kind, keep it light.</p>
        </div>
      </header>

      <div className="card flex h-[68vh] flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {loading && (
            <div className="flex h-full items-center justify-center text-slate-500">
              <Loader2 className="animate-spin" />
            </div>
          )}
          {!loading && messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm text-slate-400">Silence. Be the first to yap.</p>
            </div>
          )}
          {messages.map((m) => {
            const mine = m.user_id === user?.id;
            return (
              <div key={m.id} className={cn('flex gap-2.5', mine && 'flex-row-reverse')}>
                <Avatar url={m.profiles.avatar_url} name={m.profiles.username} size={32} />
                <div className={cn('max-w-[75%]', mine && 'items-end text-right')}>
                  <div className="mb-1 flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-400">@{m.profiles.username}</span>
                    <span>{timeAgo(m.created_at)}</span>
                  </div>
                  <div
                    className={cn(
                      'inline-block rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                      mine
                        ? 'rounded-tr-sm text-white'
                        : 'rounded-tl-sm bg-ink-800 text-slate-200',
                    )}
                    style={
                      mine
                        ? { backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' }
                        : undefined
                    }
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
            <Avatar url={profile?.avatar_url} name={profile?.username ?? 'me'} size={32} />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Say something to everyone…"
              className="input !py-2"
            />
            <button onClick={send} disabled={busy || !draft.trim()} className="btn-primary !px-3 !py-2.5">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
