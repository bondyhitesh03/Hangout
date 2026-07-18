import { Loader2, Frown, Feather, PenLine } from 'lucide-react';
import { useFeed, useBlogs } from '../lib/hooks';
import { PostCard } from '../components/PostCard';
import { BlogCard } from '../components/BlogCard';
import { NewsSection } from '../components/NewsSection';
import { JokeCard } from '../components/JokeCard';
import { QuoteCard } from '../components/QuoteCard';
import { MoodCard } from '../components/MoodCard';
import { useAuth } from '../lib/auth';
import { Avatar } from '../components/Avatar';
import { AuraBadge } from '../components/AuraBadge';

type Props = {
  onWriteBlog: () => void;
};

export function HomePage({ onWriteBlog }: Props) {
  const { posts, loading, error, reload } = useFeed();
  const { blogs } = useBlogs();
  const { profile } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Feed */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Avatar url={profile?.avatar_url} name={profile?.username ?? 'me'} size={44} ring />
            <div>
              <h1 className="text-xl font-semibold text-slate-100">
                Welcome back, {profile?.full_name || profile?.username || 'friend'}
              </h1>
              <p className="text-sm text-slate-500">Here's what your circle is sharing.</p>
            </div>
            {profile && <AuraBadge auraPlus={profile.aura_plus} auraMinus={profile.aura_minus} size="sm" className="ml-auto" />}
          </div>

          <div className="mb-5">
            <QuoteCard />
          </div>

          <div className="mb-6">
            <MoodCard />
          </div>

          {loading && (
            <div className="flex justify-center py-16 text-slate-500">
              <Loader2 className="animate-spin" />
            </div>
          )}
          {error && (
            <div className="card p-6 text-center text-sm text-rose-400">
              {error}
              <button onClick={reload} className="btn-outline ml-2">Retry</button>
            </div>
          )}
          {!loading && !error && posts.length === 0 && (
            <div className="card flex flex-col items-center gap-2 p-10 text-center">
              <Frown className="text-slate-500" />
              <p className="text-sm text-slate-400">No posts yet.</p>
              <p className="text-xs text-slate-600">Be the first — tap Create to share a photo or video.</p>
            </div>
          )}
          <div className="space-y-5">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>

          {/* Blogs section */}
          {blogs.length > 0 && (
            <section className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' }}
                >
                  <Feather size={14} className="text-white" />
                </span>
                <h2 className="text-sm font-semibold text-slate-100">From the blogs</h2>
                <button onClick={onWriteBlog} className="btn-ghost ml-auto !py-1.5 text-xs">
                  <PenLine size={14} /> Write
                </button>
              </div>
              <div className="space-y-5">
                {blogs.slice(0, 3).map((b) => (
                  <BlogCard key={b.id} blog={b} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* News rail */}
        <aside className="lg:sticky lg:top-6 lg:self-start space-y-5">
          <JokeCard />
          <NewsSection />
        </aside>
      </div>
    </div>
  );
}
