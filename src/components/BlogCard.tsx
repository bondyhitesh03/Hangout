import { useState } from 'react';
import { Heart, Trash2, Feather } from 'lucide-react';
import type { BlogWithProfile } from '../lib/types';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useBlogLikes } from '../lib/hooks';
import { Avatar } from './Avatar';
import { timeAgo, cn, formatCount } from '../lib/utils';
import { useRouter } from '../lib/router';

export function BlogCard({ blog }: { blog: BlogWithProfile }) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { likes, reload } = useBlogLikes(blog.id);
  const [expanded, setExpanded] = useState(false);
  const isOwner = user?.id === blog.user_id;
  const liked = likes.some((l) => l.user_id === user?.id);

  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      await supabase.from('blog_likes').delete().eq('blog_id', blog.id).eq('user_id', user.id);
    } else {
      await supabase.from('blog_likes').insert({ blog_id: blog.id, user_id: user.id });
    }
    reload();
  };

  const del = async () => {
    if (!isOwner || !confirm('Delete this blog?')) return;
    await supabase.from('blogs').delete().eq('id', blog.id);
  };

  const displayName = blog.profiles.full_name || blog.profiles.username;
  const long = blog.body.length > 280;

  return (
    <article className="card card-hover p-5 animate-rise">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate({ name: 'profile', userId: blog.user_id })}>
          <Avatar url={blog.profiles.avatar_url} name={displayName} size={40} />
        </button>
        <div className="min-w-0 flex-1">
          <button
            onClick={() => navigate({ name: 'profile', userId: blog.user_id })}
            className="block truncate text-sm font-semibold text-slate-100 hover:text-brand-300"
          >
            {displayName}
          </button>
          <div className="text-xs text-slate-500">@{blog.profiles.username} · {timeAgo(blog.created_at)}</div>
        </div>
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' }}
        >
          <Feather size={14} className="text-white" />
        </span>
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug text-slate-100">{blog.title}</h3>
      <p className={cn('mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300', !expanded && long && 'clamp-3')}>
        {blog.body}
      </p>
      {long && (
        <button onClick={() => setExpanded((v) => !v)} className="mt-1 text-xs font-medium text-brand-300 hover:text-brand-200">
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      <div className="mt-4 flex items-center gap-1">
        <button onClick={toggleLike} className={cn('btn-ghost gap-1.5', liked ? 'text-rose-400' : 'text-slate-300')}>
          <Heart size={17} className={cn(liked && 'fill-rose-400 scale-110')} />
          <span className="text-xs font-medium">{formatCount(likes.length)}</span>
        </button>
        {isOwner && (
          <button onClick={del} className="btn-ghost -mr-2 ml-auto p-2 text-slate-400 hover:text-rose-400" title="Delete blog">
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </article>
  );
}
