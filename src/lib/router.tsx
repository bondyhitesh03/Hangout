import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Route =
  | { name: 'home' }
  | { name: 'explore' }
  | { name: 'buddies' }
  | { name: 'snippet' }
  | { name: 'blogs' }
  | { name: 'trivia' }
  | { name: 'yap' }
  | { name: 'whisper' }
  | { name: 'whisper-thread'; userId: string }
  | { name: 'profile'; userId: string }
  | { name: 'auth' };

type Router = {
  route: Route;
  navigate: (route: Route) => void;
};

const RouterCtx = createContext<Router | undefined>(undefined);

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [seg, param] = h.split('/');
  if (seg === 'explore') return { name: 'explore' };
  if (seg === 'buddies') return { name: 'buddies' };
  if (seg === 'snippet') return { name: 'snippet' };
  if (seg === 'blogs') return { name: 'blogs' };
  if (seg === 'trivia') return { name: 'trivia' };
  if (seg === 'yap') return { name: 'yap' };
  if (seg === 'whisper' && param) return { name: 'whisper-thread', userId: param };
  if (seg === 'whisper') return { name: 'whisper' };
  if (seg === 'profile' && param) return { name: 'profile', userId: param };
  if (seg === 'auth') return { name: 'auth' };
  return { name: 'home' };
}

function toHash(r: Route): string {
  switch (r.name) {
    case 'home':
      return '#/';
    case 'explore':
      return '#/explore';
    case 'buddies':
      return '#/buddies';
    case 'yap':
      return '#/yap';
    case 'snippet':
      return '#/snippet';
    case 'blogs':
      return '#/blogs';
    case 'trivia':
      return '#/trivia';
    case 'whisper':
      return '#/whisper';
    case 'whisper-thread':
      return `#/whisper/${r.userId}`;
    case 'auth':
      return '#/auth';
    case 'profile':
      return `#/profile/${r.userId}`;
  }
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (r: Route) => {
    const h = toHash(r);
    if (window.location.hash !== h) {
      window.location.hash = h;
    } else {
      setRoute(r);
    }
  };

  return <RouterCtx.Provider value={{ route, navigate }}>{children}</RouterCtx.Provider>;
}

export function useRouter(): Router {
  const ctx = useContext(RouterCtx);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
