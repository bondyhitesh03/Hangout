import { useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, Share2, ChevronUp, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { useSnippetPosts } from '../lib/hooks';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { Avatar } from '../components/Avatar';
import { timeAgo, cn } from '../lib/utils';
import type { PostWithProfile } from '../lib/types';

export function SnippetPage() {
  const { posts, loading } = useSnippetPosts();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (posts.length === 0) return;
    posts.forEach((p) => {
      supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', p.id).then(({ count }) => {
        setLikeCounts((m) => ({ ...m, [p.id]: count ?? 0 }));
      });
      if (user) {
        supabase
          .from('likes')
          .select('id')
          .eq('post_id', p.id)
          .eq('user_id', user.id)
          .maybeSingle()
          .then(({ data }) => setLiked((m) => ({ ...m, [p.id]: !!data })));
      }
    });
  }, [posts, user]);

  const scrollBy = (dir: number) => {
    const next = Math.max(0, Math.min(posts.length - 1, index + dir));
    setIndex(next);
    containerRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleLike = async (post: PostWithProfile) => {
    if (!user) return;
    const isLiked = liked[post.id];
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      setLiked((m) => ({ ...m, [post.id]: false }));
      setLikeCounts((m) => ({ ...m, [post.id]: Math.max(0, (m[post.id] ?? 1) - 1) }));
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
      setLiked((m) => ({ ...m, [post.id]: true }));
      setLikeCounts((m) => ({ ...m, [post.id]: (m[post.id] ?? 0) + 1 }));
    }
  };

  const share = async (post: PostWithProfile) => {
    const url = `${window.location.origin}/#/profile/${post.user_id}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Hangout snippet', url });
      else {
        await navigator.clipboard.writeText(url);
        alert('Link copied!');
      }
    } catch {
      /* dismissed */
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-slate-500">
        <div className="animate-pulse">Loading snippets…</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="card mx-auto mt-20 max-w-md p-10 text-center text-sm text-slate-400">
        No snippets yet. Share a photo or video to see it here.
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-1rem)] md:h-screen md:pt-2">
      <div
        ref={containerRef}
        className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth"
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollTop / el.clientHeight);
          if (i !== index) setIndex(i);
        }}
      >
        {posts.map((post, i) => {
          const displayName = post.profiles.full_name || post.profiles.username;
          return (
            <section
              key={post.id}
              className="flex h-full w-full snap-start items-center justify-center bg-black relative"
            >
              {post.media_type === 'video' ? (
                <video
                  src={post.media_url}
                  className="h-full w-full object-contain"
                  loop
                  autoPlay={i === index}
                  muted={muted}
                  playsInline
                  controls={false}
                />
              ) : (
                <img src={post.media_url} alt={post.caption ?? 'snippet'} className="h-full w-full object-contain" />
              )}

              {/* gradient overlay */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* mute toggle */}
              <button
                onClick={() => setMuted((m) => !m)}
                className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/70"
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              {/* right action rail */}
              <div className="absolute bottom-24 right-3 flex flex-col items-center gap-5 text-white">
                <button onClick={() => toggleLike(post)} className="flex flex-col items-center gap-1">
                  <span
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-transform',
                      liked[post.id] ? 'scale-110' : 'hover:scale-105',
                    )}
                  >
                    <Heart size={22} className={liked[post.id] ? 'fill-rose-500 text-rose-500' : 'text-white'} />
                  </span>
                  <span className="text-[11px] font-medium">{likeCounts[post.id] ?? 0}</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm hover:scale-105">
                    <MessageCircle size={21} />
                  </span>
                  <span className="text-[11px] font-medium">Chat</span>
                </button>
                <button onClick={() => share(post)} className="flex flex-col items-center gap-1">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm hover:scale-105">
                    <Share2 size={21} />
                  </span>
                  <span className="text-[11px] font-medium">Share</span>
                </button>
              </div>

              {/* caption */}
              <div className="absolute bottom-24 left-4 right-20 text-white">
                <button
                  onClick={() => navigate({ name: 'profile', userId: post.user_id })}
                  className="flex items-center gap-2.5"
                >
                  <Avatar url={post.profiles.avatar_url} name={displayName} size={40} ring />
                  <div className="text-left">
                    <div className="text-sm font-semibold">@{post.profiles.username}</div>
                    <div className="text-[11px] text-white/60">{timeAgo(post.created_at)}</div>
                  </div>
                </button>
                {post.caption && (
                  <p className="mt-3 text-sm leading-relaxed text-white/90 line-clamp-3">{post.caption}</p>
                )}
              </div>

              {/* nav arrows (desktop) */}
              <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-2 md:flex">
                <button
                  onClick={() => scrollBy(-1)}
                  disabled={i === 0}
                  className="rounded-full bg-black/40 p-2 text-white backdrop-blur-sm disabled:opacity-30 hover:bg-black/70"
                >
                  <ChevronUp size={20} />
                </button>
                <button
                  onClick={() => scrollBy(1)}
                  disabled={i === posts.length - 1}
                  className="rounded-full bg-black/40 p-2 text-white backdrop-blur-sm disabled:opacity-30 hover:bg-black/70"
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
