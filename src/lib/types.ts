export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  aura_plus: number;
  aura_minus: number;
};

export type Post = {
  id: string;
  user_id: string;
  caption: string | null;
  media_url: string;
  media_type: 'photo' | 'video';
  created_at: string;
};

export type PostWithProfile = Post & {
  profiles: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>;
};

export type Like = {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type CommentWithProfile = Comment & {
  profiles: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
};

export type Follow = {
  id: string;
  follower_id: string;
  followee_id: string;
  created_at: string;
};

export type YapMessage = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type YapMessageWithProfile = YapMessage & {
  profiles: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
};

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  category: string;
  url: string | null;
  image_url: string | null;
  summary: string | null;
  published_at: string;
};

export type DmThread = {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
};

export type DmMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type DmMessageWithProfile = DmMessage & {
  profiles: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
};

export type Joke = {
  id: string;
  setup: string;
  punchline: string;
  created_at: string;
};

export type Blog = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  created_at: string;
};

export type BlogWithProfile = Blog & {
  profiles: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>;
};

export type BlogLike = {
  id: string;
  blog_id: string;
  user_id: string;
  created_at: string;
};

export type TriviaQuestion = {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  category: string | null;
};

export type TriviaAnswer = {
  id: string;
  user_id: string;
  question_id: string;
  selected_index: number;
  correct: boolean;
  created_at: string;
};

export type LeaderboardEntry = {
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  aura_plus: number;
  aura_minus: number;
  total: number;
};
