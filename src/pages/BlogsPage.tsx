import { Loader2, Feather, PenLine } from 'lucide-react';
import { useBlogs } from '../lib/hooks';
import { BlogCard } from '../components/BlogCard';

type Props = {
  onCompose: () => void;
};

export function BlogsPage({ onCompose }: Props) {
  const { blogs, loading } = useBlogs();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
      <header className="mb-6 flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' }}
        >
          <Feather size={18} className="text-white" />
        </span>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-100">Blogs</h1>
          <p className="text-sm text-slate-500">Long-form thoughts from the Hangout community.</p>
        </div>
        <button onClick={onCompose} className="btn-primary !py-2">
          <PenLine size={16} /> Write
        </button>
      </header>

      {loading && (
        <div className="flex justify-center py-16 text-slate-500">
          <Loader2 className="animate-spin" />
        </div>
      )}
      {!loading && blogs.length === 0 && (
        <div className="card flex flex-col items-center gap-2 p-10 text-center">
          <Feather className="text-slate-500" />
          <p className="text-sm text-slate-400">No blogs yet.</p>
          <p className="text-xs text-slate-600">Be the first to share a story.</p>
        </div>
      )}
      <div className="space-y-5">
        {blogs.map((b) => (
          <BlogCard key={b.id} blog={b} />
        ))}
      </div>
    </div>
  );
}
