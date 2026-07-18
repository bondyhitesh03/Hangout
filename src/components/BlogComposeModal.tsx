import { useState } from 'react';
import { X, Feather, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

type Props = {
  open: boolean;
  onClose: () => void;
  onPosted: () => void;
};

export function BlogComposeModal({ open, onClose, onPosted }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = async () => {
    if (!user || !title.trim() || !body.trim()) {
      setError('Add a title and some body text.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: e } = await supabase
        .from('blogs')
        .insert({ user_id: user.id, title: title.trim(), body: body.trim() });
      if (e) throw new Error(e.message);
      setTitle('');
      setBody('');
      onPosted();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg card overflow-hidden animate-rise">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Feather size={16} className="text-brand-300" /> Write a blog
          </h3>
          <button onClick={onClose} className="btn-ghost p-1.5 text-slate-400">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="input text-base font-semibold"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="Share your thoughts…"
            className="input resize-none"
          />
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-white/5 px-4 py-3">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={submit} disabled={busy} className="btn-primary">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Feather size={16} />}
            {busy ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
