import { useEffect, useState } from 'react';
import { Loader2, Pencil, UserPlus, UserCheck, Camera, Check, X, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { useUserPosts, useUserBlogs } from '../lib/hooks';
import { Avatar } from '../components/Avatar';
import { PostCard } from '../components/PostCard';
import { BlogCard } from '../components/BlogCard';
import { AuraBadge } from '../components/AuraBadge';
import { formatCount } from '../lib/utils';
import { MEDIA_BUCKET } from '../lib/supabase';
import type { Profile } from '../lib/types';

type Props = {
  userId: string;
};

export function ProfilePage({ userId }: Props) {
  const { user, profile: me, refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const { posts, loading } = useUserPosts(userId);
  const { blogs } = useUserBlogs(userId);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editing, setEditing] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const isMe = user?.id === userId;

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data as Profile | null);
    setLoadingProfile(false);
  };

  const loadCounts = async () => {
    const [{ count: f }, { count: fg }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('followee_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ]);
    setFollowerCount(f ?? 0);
    setFollowingCount(fg ?? 0);
  };

  const checkFollowing = async () => {
    if (!user || isMe) return;
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('followee_id', userId)
      .maybeSingle();
    setFollowing(!!data);
  };

  useEffect(() => {
    loadProfile();
    loadCounts();
    checkFollowing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const toggleFollow = async () => {
    if (!user) return;
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('followee_id', userId);
      setFollowing(false);
      setFollowerCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, followee_id: userId });
      setFollowing(true);
      setFollowerCount((c) => c + 1);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex justify-center py-20 text-slate-500">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card mx-auto mt-20 max-w-md p-8 text-center text-sm text-slate-400">
        Profile not found.
      </div>
    );
  }

  const displayName = profile.full_name || profile.username;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
      <div className="px-4">
        <div className="flex items-end justify-between gap-3">
          <div className="rounded-full bg-ink-900 p-1">
            <Avatar url={profile.avatar_url} name={displayName} size={88} ring />
          </div>
          {isMe ? (
            <button onClick={() => setEditing(true)} className="btn-outline">
              <Pencil size={15} /> Edit profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => navigate({ name: 'whisper-thread', userId: profile.id })} className="btn-outline" title="Whisper to this user">
                <Send size={15} /> Whisper
              </button>
              <button onClick={toggleFollow} className={following ? 'btn-outline' : 'btn-primary'}>
                {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
                {following ? 'Following' : 'Follow'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-4">
          <h1 className="text-2xl font-semibold text-slate-100">{displayName}</h1>
          <p className="text-sm text-slate-500">@{profile.username}</p>
          {profile.bio && <p className="mt-3 text-sm leading-relaxed text-slate-300">{profile.bio}</p>}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <div>
              <span className="font-semibold text-slate-100">{formatCount(posts.length)}</span>{' '}
              <span className="text-slate-500">posts</span>
            </div>
            <div>
              <span className="font-semibold text-slate-100">{formatCount(followerCount)}</span>{' '}
              <span className="text-slate-500">followers</span>
            </div>
            <div>
              <span className="font-semibold text-slate-100">{formatCount(followingCount)}</span>{' '}
              <span className="text-slate-500">following</span>
            </div>
            <AuraBadge auraPlus={profile.aura_plus} auraMinus={profile.aura_minus} size="sm" />
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="mt-8">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {isMe ? 'Your posts' : 'Posts'}
        </h2>
        {loading && (
          <div className="flex justify-center py-10 text-slate-500">
            <Loader2 className="animate-spin" />
          </div>
        )}
        {!loading && posts.length === 0 && (
          <p className="card p-10 text-center text-sm text-slate-500">
            {isMe ? 'No posts yet — share your first photo or video.' : 'No posts yet.'}
          </p>
        )}
        <div className="space-y-5">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </div>

      {/* Blogs */}
      {blogs.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {isMe ? 'Your blogs' : 'Blogs'}
          </h2>
          <div className="space-y-5">
            {blogs.map((b) => (
              <BlogCard key={b.id} blog={b} />
            ))}
          </div>
        </div>
      )}

      {editing && isMe && me && (
        <EditProfileModal
          profile={me}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            await refreshProfile();
            await loadProfile();
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAvatar = async (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, f, {
      cacheControl: '3600',
      upsert: true,
      contentType: f.type,
    });
    if (upErr) throw new Error(upErr.message);
    const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
    setAvatarUrl(url);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const { error: e } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() || null, bio: bio.trim() || null, avatar_url: avatarUrl || null })
        .eq('id', profile.id);
      if (e) throw new Error(e.message);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card overflow-hidden animate-rise">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-100">Edit profile</h3>
          <button onClick={onClose} className="btn-ghost p-1.5 text-slate-400">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar url={avatarUrl} name={fullName || profile.username} size={84} ring />
            <label className="btn-outline cursor-pointer !py-1.5 text-xs">
              <Camera size={14} /> Change photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAvatar(f);
                }}
              />
            </label>
          </div>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs text-slate-500">Full name</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input mt-1" />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">Bio</span>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="input mt-1 resize-none" />
            </label>
            {error && <p className="text-xs text-rose-400">{error}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-white/5 px-4 py-3">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={busy} className="btn-primary">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save
          </button>
        </div>
      </div>
    </div>
  );
}
