import { Home, Compass, MessageSquareText, Contact, LogOut, Plus, Search, Clapperboard, Send, Feather, Brain, Users } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useRouter, type Route } from '../lib/router';
import { Avatar } from './Avatar';
import { cn } from '../lib/utils';

type NavProps = {
  onCompose: () => void;
  onSearch: () => void;
};

type Item = { key: string; label: string; icon: typeof Home; route: Route };

const items: Item[] = [
  { key: 'home', label: 'Home', icon: Home, route: { name: 'home' } },
  { key: 'explore', label: 'Explore', icon: Compass, route: { name: 'explore' } },
  { key: 'buddies', label: 'Buddies', icon: Users, route: { name: 'buddies' } },
  { key: 'snippet', label: 'Snippet', icon: Clapperboard, route: { name: 'snippet' } },
  { key: 'blogs', label: 'Blogs', icon: Feather, route: { name: 'blogs' } },
  { key: 'trivia', label: 'Trivia', icon: Brain, route: { name: 'trivia' } },
  { key: 'yap', label: 'Yap', icon: MessageSquareText, route: { name: 'yap' } },
  { key: 'whisper', label: 'Whisper', icon: Send, route: { name: 'whisper' } },
];

export function Nav({ onCompose, onSearch }: NavProps) {
  const { profile, signOut } = useAuth();
  const { route, navigate } = useRouter();

  const isActive = (key: string) => {
    if (key === 'whisper') return route.name === 'whisper' || route.name === 'whisper-thread';
    return route.name === key;
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex sticky top-0 h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-ink-900/40 backdrop-blur-md px-4 py-6">
        <button
          onClick={() => navigate({ name: 'home' })}
          className="mb-8 flex items-center gap-2 px-2"
          aria-label="Hangout home"
        >
          <span className="logo-text text-4xl leading-none">Hangout</span>
        </button>

        <button
          onClick={onSearch}
          className="mb-3 flex items-center gap-3 rounded-xl border border-white/5 bg-ink-900/50 px-3 py-2.5 text-sm text-slate-400 transition-all hover:border-brand-400/30 hover:text-slate-200"
        >
          <Search size={18} />
          Search people
        </button>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map(({ key, label, icon: Icon, route: r }) => {
            const active = isActive(key);
            return (
              <button
                key={key}
                onClick={() => navigate(r)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-white/5 text-white shadow-[inset_0_0_0_1px_rgba(124,156,255,0.25)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5',
                )}
              >
                <Icon size={20} className={active ? 'text-brand-300' : ''} />
                {label}
              </button>
            );
          })}

          {profile && (
            <button
              onClick={() => navigate({ name: 'profile', userId: profile.id })}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                route.name === 'profile'
                  ? 'bg-white/5 text-white shadow-[inset_0_0_0_1px_rgba(124,156,255,0.25)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5',
              )}
            >
              <Contact size={20} className={route.name === 'profile' ? 'text-brand-300' : ''} />
              My ID
            </button>
          )}
        </nav>

        <button onClick={onCompose} className="btn-primary mt-4 w-full !py-2.5">
          <Plus size={18} /> Create
        </button>

        {profile && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/5 bg-ink-850/60 p-2">
            <Avatar url={profile.avatar_url} name={profile.username} size={36} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-100">{profile.full_name || profile.username}</div>
              <div className="truncate text-xs text-slate-500">@{profile.username}</div>
            </div>
            <button onClick={signOut} className="btn-ghost p-2 text-slate-400 hover:text-rose-400" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-ink-900/80 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate({ name: 'home' })} aria-label="Hangout home">
          <span className="logo-text text-3xl leading-none">Hangout</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={onSearch} className="btn-ghost p-2" aria-label="Search">
            <Search size={18} />
          </button>
          <button onClick={onCompose} className="btn-primary !px-3 !py-2">
            <Plus size={18} />
          </button>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-white/5 bg-ink-900/90 px-1 py-2 backdrop-blur-md">
        {items.map(({ key, label, icon: Icon, route: r }) => {
          const active = isActive(key);
          return (
            <button
              key={key}
              onClick={() => navigate(r)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[9px] font-medium transition-colors',
                active ? 'text-brand-300' : 'text-slate-500',
              )}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
        {profile && (
          <button
            onClick={() => navigate({ name: 'profile', userId: profile.id })}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[9px] font-medium transition-colors',
              route.name === 'profile' ? 'text-brand-300' : 'text-slate-500',
            )}
          >
            <Contact size={18} />
            ID
          </button>
        )}
      </nav>
    </>
  );
}
