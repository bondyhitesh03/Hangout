import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { RouterProvider, useRouter } from './lib/router';
import { Nav } from './components/Nav';
import { ComposeModal } from './components/ComposeModal';
import { BlogComposeModal } from './components/BlogComposeModal';
import { SearchModal } from './components/SearchModal';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { BuddiesPage } from './pages/BuddiesPage';
import { SnippetPage } from './pages/SnippetPage';
import { BlogsPage } from './pages/BlogsPage';
import { TriviaPage } from './pages/TriviaPage';
import { YapPage } from './pages/YapPage';
import { WhisperPage, WhisperThreadPage } from './pages/WhisperPage';
import { ProfilePage } from './pages/ProfilePage';
import { Loader2 } from 'lucide-react';

function Shell() {
  const { user, loading } = useAuth();
  const { route } = useRouter();
  const [compose, setCompose] = useState(false);
  const [blogCompose, setBlogCompose] = useState(false);
  const [search, setSearch] = useState(false);

  if (loading) {
    return (
      <div className="app-bg flex min-h-screen items-center justify-center text-slate-500">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  let page: React.ReactNode;
  switch (route.name) {
    case 'explore':
      page = <ExplorePage />;
      break;
    case 'buddies':
      page = <BuddiesPage />;
      break;
    case 'snippet':
      page = <SnippetPage />;
      break;
    case 'blogs':
      page = <BlogsPage onCompose={() => setBlogCompose(true)} />;
      break;
    case 'trivia':
      page = <TriviaPage />;
      break;
    case 'yap':
      page = <YapPage />;
      break;
    case 'whisper':
      page = <WhisperPage />;
      break;
    case 'whisper-thread':
      page = <WhisperThreadPage userId={route.userId} />;
      break;
    case 'profile':
      page = <ProfilePage key={route.userId} userId={route.userId} />;
      break;
    case 'home':
    default:
      page = <HomePage onWriteBlog={() => setBlogCompose(true)} />;
  }

  const isImmersive = route.name === 'snippet';

  return (
    <div className="app-bg min-h-screen text-slate-200">
      <div className="flex">
        <Nav onCompose={() => setCompose(true)} onSearch={() => setSearch(true)} />
        <main className={isImmersive ? 'min-w-0 flex-1' : 'min-w-0 flex-1 pb-16 md:pb-0'}>{page}</main>
      </div>
      <ComposeModal open={compose} onClose={() => setCompose(false)} onPosted={() => {}} />
      <BlogComposeModal open={blogCompose} onClose={() => setBlogCompose(false)} onPosted={() => {}} />
      <SearchModal open={search} onClose={() => setSearch(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <Shell />
      </RouterProvider>
    </AuthProvider>
  );
}
