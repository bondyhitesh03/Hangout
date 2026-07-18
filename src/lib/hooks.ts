import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';
import type { PostWithProfile, Like, CommentWithProfile, NewsItem, DmThread, DmMessageWithProfile, Joke, BlogWithProfile, BlogLike, TriviaQuestion, TriviaAnswer, LeaderboardEntry } from './types';

export function useFeed() {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('id, user_id, caption, media_url, media_type, created_at, profiles!posts_user_id_fkey(id, username, full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) setError(error.message);
    else setPosts((data ?? []) as unknown as PostWithProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel('feed-posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => load())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  return { posts, loading, error, reload: load };
}

export function useUserPosts(userId: string | null) {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('id, user_id, caption, media_url, media_type, created_at, profiles!posts_user_id_fkey(id, username, full_name, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setPosts((data ?? []) as unknown as PostWithProfile[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { posts, loading, reload: load };
}

export function useAllPosts() {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('id, user_id, caption, media_url, media_type, created_at, profiles!posts_user_id_fkey(id, username, full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(200);
    setPosts((data ?? []) as unknown as PostWithProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel('explore-posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  return { posts, loading, reload: load };
}

export function useLikes(postId: string | null) {
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!postId) {
      setLikes([]);
      return;
    }
    const { data } = await supabase.from('likes').select('*').eq('post_id', postId);
    setLikes(data ?? []);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  return { likes, loading, reload: load };
}

export function useComments(postId: string | null) {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!postId) {
      setComments([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('comments')
      .select('id, post_id, user_id, content, created_at, profiles!comments_user_id_fkey(id, username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setComments((data ?? []) as unknown as CommentWithProfile[]);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  return { comments, loading, reload: load };
}

export function useNews() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('news_items')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, []);

  return { items, loading };
}

export function useSnippetPosts() {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('id, user_id, caption, media_url, media_type, created_at, profiles!posts_user_id_fkey(id, username, full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(100);
    setPosts((data ?? []) as unknown as PostWithProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel('snippet-posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => load())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  return { posts, loading };
}

export function useDmThreads() {
  const [threads, setThreads] = useState<(DmThread & { other: { id: string; username: string; full_name: string | null; avatar_url: string | null }; last_message?: string; last_at?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const load = useCallback(async () => {
    if (!user) {
      setThreads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('dm_threads')
      .select('id, user_a, user_b, created_at')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order('created_at', { ascending: false });
    const raw = (data ?? []) as unknown as DmThread[];
    const otherIds = raw.map((t) => (t.user_a === user.id ? t.user_b : t.user_a));
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', otherIds.length ? otherIds : ['00000000-0000-0000-0000-000000000000']);
    const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
    const withLast = await Promise.all(
      raw.map(async (t) => {
        const otherId = t.user_a === user.id ? t.user_b : t.user_a;
        const other = profMap.get(otherId);
        const { data: msgs } = await supabase
          .from('dm_messages')
          .select('content, created_at')
          .eq('thread_id', t.id)
          .order('created_at', { ascending: false })
          .limit(1);
        const last = (msgs ?? [])[0];
        return {
          ...t,
          other: {
            id: other?.id ?? otherId,
            username: other?.username ?? 'user',
            full_name: other?.full_name ?? null,
            avatar_url: other?.avatar_url ?? null,
          },
          last_message: last?.content,
          last_at: last?.created_at,
        };
      }),
    );
    withLast.sort((a, b) => (b.last_at ?? b.created_at).localeCompare(a.last_at ?? a.created_at));
    setThreads(withLast);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { threads, loading, reload: load };
}

export function useDmMessages(threadId: string | null) {
  const [messages, setMessages] = useState<DmMessageWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!threadId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('dm_messages')
      .select('id, thread_id, sender_id, content, created_at, profiles!dm_messages_sender_id_fkey(id, username, avatar_url)')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    setMessages((data ?? []) as unknown as DmMessageWithProfile[]);
    setLoading(false);
  }, [threadId]);

  useEffect(() => {
    load();
  }, [load]);

  return { messages, loading, reload: load };
}

export function useJokes() {
  const [joke, setJoke] = useState<Joke | null>(null);
  const [loading, setLoading] = useState(true);
  const [pool, setPool] = useState<Joke[]>([]);

  const pickRandom = useCallback((items: Joke[]) => {
    if (items.length === 0) return;
    setJoke(items[Math.floor(Math.random() * items.length)]);
  }, []);

  const refresh = useCallback(() => {
    pickRandom(pool);
  }, [pool, pickRandom]);

  useEffect(() => {
    supabase
      .from('jokes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        const items = (data ?? []) as Joke[];
        setPool(items);
        pickRandom(items);
        setLoading(false);
      });
  }, [pickRandom]);

  return { joke, loading, refresh };
}

export async function findOrCreateThread(userA: string, userB: string): Promise<string | null> {
  // find existing
  const { data: existing } = await supabase
    .from('dm_threads')
    .select('id')
    .or(`and(user_a.eq.${userA},user_b.eq.${userB}),and(user_a.eq.${userB},user_b.eq.${userA})`)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const { data, error } = await supabase
    .from('dm_threads')
    .insert({ user_a: userA, user_b: userB })
    .select('id')
    .single();
  if (error) return null;
  return data.id;
}

export function useBlogs() {
  const [blogs, setBlogs] = useState<BlogWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('blogs')
      .select('id, user_id, title, body, created_at, profiles!blogs_user_id_fkey(id, username, full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);
    setBlogs((data ?? []) as unknown as BlogWithProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel('blogs-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'blogs' }, () => load())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'blogs' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  return { blogs, loading, reload: load };
}

export function useUserBlogs(userId: string | null) {
  const [blogs, setBlogs] = useState<BlogWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setBlogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('blogs')
      .select('id, user_id, title, body, created_at, profiles!blogs_user_id_fkey(id, username, full_name, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setBlogs((data ?? []) as unknown as BlogWithProfile[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { blogs, loading, reload: load };
}

export function useBlogLikes(blogId: string | null) {
  const [likes, setLikes] = useState<BlogLike[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!blogId) {
      setLikes([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('blog_likes').select('*').eq('blog_id', blogId);
    setLikes(data ?? []);
    setLoading(false);
  }, [blogId]);

  useEffect(() => {
    load();
  }, [load]);

  return { likes, loading, reload: load };
}

export function useTrivia() {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('trivia_questions').select('*');
    const items = ((data ?? []) as TriviaQuestion[]).slice();
    items.sort(() => Math.random() - 0.5);
    setQuestions(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { questions, loading, reload: load };
}

export function useTriviaAnswers(userId: string | null) {
  const [answered, setAnswered] = useState<TriviaAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setAnswered([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('trivia_answers').select('*').eq('user_id', userId);
    setAnswered((data ?? []) as TriviaAnswer[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { answered, loading, reload: load };
}

export function useLeaderboard() {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, aura_plus, aura_minus')
      .limit(50);
    const mapped = ((data ?? []) as any[]).map((p) => ({
      user_id: p.id,
      username: p.username,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      aura_plus: p.aura_plus ?? 0,
      aura_minus: p.aura_minus ?? 0,
      total: (p.aura_plus ?? 0) - (p.aura_minus ?? 0),
    }));
    mapped.sort((a, b) => b.total - a.total);
    setRows(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, loading, reload: load };
}

export async function submitTriviaAnswer(
  userId: string,
  question: TriviaQuestion,
  selectedIndex: number,
): Promise<{ correct: boolean; error: string | null }> {
  const correct = selectedIndex === question.correct_index;
  const { error: insErr } = await supabase.from('trivia_answers').insert({
    user_id: userId,
    question_id: question.id,
    selected_index: selectedIndex,
    correct,
  });
  if (insErr) return { correct, error: insErr.message };

  const col = correct ? 'aura_plus' : 'aura_minus';
  const delta = correct ? 10 : 1;
  const { data: prof } = await supabase
    .from('profiles')
    .select(col)
    .eq('id', userId)
    .single();
  const next = ((prof?.[col] as number) ?? 0) + delta;
  await supabase.from('profiles').update({ [col]: next }).eq('id', userId);

  return { correct, error: null };
}
