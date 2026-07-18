import { useState } from 'react';
import { Heart, MessageCircle, Share2, Trash2, Send, X } from 'lucide-react';
import type { PostWithProfile } from '../lib/types';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useLikes, useComments } from '../lib/hooks';
import { Avatar } from './Avatar';
import { timeAgo, cn, formatCount } from '../lib/utils';
import { useRouter } from '../lib/router';

type Props = {
  post: PostWithProfile;
};

export function PostCard({ post }: Props) {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const { likes, reload: reloadLikes } = useLikes(post.id);
  const { comments, reload: reloadComments } = useComments(post.id);
  const [commentOpen, setCommentOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [shared, setShared] = useState(false);
  const [busy, setBusy] = useState(false);

  const liked = likes.some((l) => l.user_id === user?.id);
  const isOwner = user?.id === post.user_id;

  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
    }
    reloadLikes();
  };

  const submitComment = async () => {
    if (!user || !draft.trim()) return;
    setBusy(true);
    await supabase.from('comments').insert({ post_id: post.id, user_id: user.id, content: draft.trim() });
    setDraft('');
    setBusy(false);
    reloadComments();
  };

  const deletePost = async () => {
    if (!isOwner) return;
    if (!confirm('Delete this post? This cannot be undone.')) return;
    // best-effort delete media
    try {
      const path = post.media_url.split(`/public/${'media'}/`)[1];
      if (path) await supabase.storage.from('media').remove([path]);
    } catch {
      /* ignore */
    }
    await supabase.from('posts').delete().eq('id', post.id);
  };

  const share = async () => {
    const url = `${window.location.origin}/#/profile/${post.user_id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Hangout post', url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1800);
      }
    } catch {
      /* user dismissed */
    }
  };

  const displayName = post.profiles.full_name || post.profiles.username;

  return (
    <article className="card card-hover overflow-hidden animate-rise">
      {/* header */}
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => navigate({ name: 'profile', userId: post.user_id })} className="shrink-0">
          <Avatar url={post.profiles.avatar_url} name={displayName} size={42} />
        </button>
        <div className="min-w-0 flex-1">
          <button
            onClick={() => navigate({ name: 'profile', userId: post.user_id })}
            className="block truncate text-sm font-semibold text-slate-100 hover:text-brand-300"
          >
            {displayName}
          </button>
          <div className="text-xs text-slate-500">@{post.profiles.username} · {timeAgo(post.created_at)}</div>
        </div>
        {isOwner && (
          <button onClick={deletePost} className="btn-ghost -mr-2 p-2 text-slate-400 hover:text-rose-400" title="Delete post">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* media */}
      {post.media_type === 'video' ? (
        <div className="bg-black">
          <video src={post.media_url} controls className="max-h-[640px] w-full object-contain" />
        </div>
      ) : (
        <button onClick={() => setCommentOpen(false)} className="block w-full bg-black">
          <img src={post.media_url} alt={post.caption ?? 'post'} className="max-h-[640px] w-full object-contain" loading="lazy" />
        </button>
      )}

      {/* caption */}
      {post.caption && (
        <p className="px-4 pt-3 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">{post.caption}</p>
      )}

      {/* actions */}
      <div className="flex items-center gap-1 px-3 py-3">
        <button
          onClick={toggleLike}
          className={cn(
            'btn-ghost group gap-1.5',
            liked ? 'text-rose-400' : 'text-slate-300',
          )}
        >
          <Heart size={18} className={cn('transition-transform', liked ? 'fill-rose-400 scale-110' : 'group-hover:scale-110')} />
          <span className="text-xs font-medium">{formatCount(likes.length)}</span>
        </button>
        <button onClick={() => setCommentOpen((v) => !v)} className="btn-ghost gap-1.5 text-slate-300">
          <MessageCircle size={18} />
          <span className="text-xs font-medium">{formatCount(comments.length)}</span>
        </button>
        <button onClick={share} className="btn-ghost gap-1.5 text-slate-300">
          <Share2 size={18} />
          <span className="text-xs font-medium">{shared ? 'Copied' : 'Share'}</span>
        </button>
      </div>

      {/* comments */}
      {commentOpen && (
        <div className="border-t border-white/5 px-4 py-3 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Comments</h4>
            <button onClick={() => setCommentOpen(false)} className="btn-ghost -mr-2 p-1.5 text-slate-500">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {comments.length === 0 && (
              <p className="text-xs text-slate-500 py-2">No comments yet — say something nice.</p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2.5">
                <Avatar url={c.profiles.avatar_url} name={c.profiles.username} size={28} />
                <div className="min-w-0">
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200">@{c.profiles.username}</span>{' '}
                    <span className="text-slate-400">{c.content}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{timeAgo(c.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
          {user && (
            <div className="mt-3 flex items-center gap-2">
              <Avatar url={profile?.avatar_url} name={profile?.username ?? 'me'} size={28} />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                placeholder="Add a comment…"
                className="input !py-2 text-xs"
              />
              <button onClick={submitComment} disabled={busy || !draft.trim()} className="btn-primary !px-3 !py-2">
                <Send size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
