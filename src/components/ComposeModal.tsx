import { useRef, useState } from 'react';
import { X, Image as ImageIcon, Film, Loader2, Sparkles } from 'lucide-react';
import { supabase, MEDIA_BUCKET } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { mediaPublicUrl } from '../lib/utils';

type Props = {
  open: boolean;
  onClose: () => void;
  onPosted: () => void;
};

export function ComposeModal({ open, onClose, onPosted }: Props) {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setMediaType(f.type.startsWith('video') ? 'video' : 'photo');
    setPreview(URL.createObjectURL(f));
    setError(null);
  };

  const submit = async () => {
    if (!user || !file) {
      setError('Please choose a photo or video.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      });
      if (upErr) throw new Error(upErr.message);
      const url = mediaPublicUrl(MEDIA_BUCKET, path);
      const { error: pErr } = await supabase
        .from('posts')
        .insert({ user_id: user.id, caption: caption.trim() || null, media_url: url, media_type: mediaType });
      if (pErr) throw new Error(pErr.message);
      setCaption('');
      setFile(null);
      setPreview(null);
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
            <Sparkles size={16} className="text-brand-300" /> Create a post
          </h3>
          <button onClick={onClose} className="btn-ghost p-1.5 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {preview ? (
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-black">
              {mediaType === 'video' ? (
                <video src={preview} controls className="max-h-80 w-full object-contain" />
              ) : (
                <img src={preview} alt="preview" className="max-h-80 w-full object-contain" />
              )}
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-ink-900/40 px-6 py-10 text-center transition-colors hover:border-brand-400/40 hover:bg-brand-400/5"
            >
              <div className="flex items-center gap-2 text-slate-300">
                <ImageIcon size={22} className="text-brand-300" />
                <Film size={22} className="text-mint-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Drop a photo or video</div>
                <div className="text-xs text-slate-500">JPG, PNG, MP4, WebM — up to ~25MB</div>
              </div>
            </button>
          )}
          <input ref={inputRef} type="file" accept="image/*,video/*" onChange={pick} className="hidden" />

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            placeholder="Write a caption…"
            className="input mt-4 resize-none"
          />

          {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/5 px-4 py-3">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={submit} disabled={busy || !file} className="btn-primary">
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {busy ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
