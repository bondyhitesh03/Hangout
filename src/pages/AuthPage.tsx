import { useState } from 'react';
import { Loader2, Mail, Lock, User as UserIcon, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';

export function AuthPage() {
  const { refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signup') {
        if (!username.trim()) throw new Error('Choose a username.');
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.trim(), full_name: fullName.trim() || null } },
        });
        if (signUpErr) throw signUpErr;
        const uid = data.user?.id;
        if (uid) {
          await supabase.from('profiles').upsert({
            id: uid,
            username: username.trim(),
            full_name: fullName.trim() || null,
          });
        }
        await refreshProfile();
        navigate({ name: 'home' });
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
        await refreshProfile();
        navigate({ name: 'home' });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="logo-text text-6xl">Hangout</span>
          <p className="mt-2 text-sm text-slate-400">A minimal place to post, yap, and explore.</p>
        </div>

        <div className="card p-6 animate-rise">
          <div className="mb-5 flex items-center gap-1 rounded-xl bg-ink-900/60 p-1">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  mode === m ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(124,156,255,0.3)]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' && (
              <>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="input pl-9"
                    autoComplete="username"
                  />
                </div>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name (optional)"
                  className="input"
                  autoComplete="name"
                />
              </>
            )}
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="input pl-9"
                autoComplete="email"
                required
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="input pl-9"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
              />
            </div>

            {error && <p className="text-xs text-rose-400">{error}</p>}

            <button type="submit" disabled={busy} className="btn-primary w-full !py-2.5">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-slate-600">
          By continuing you agree to be kind to one another.
        </p>
      </div>
    </div>
  );
}
