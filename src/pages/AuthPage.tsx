import { useState } from 'react';
import { Loader2, Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';

export function AuthPage() {
  const { refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const switchMode = (m: 'signin' | 'signup') => {
    setMode(m);
    setError(null);
  };

  return (
    <div className="min-h-screen flex bg-ink-950">
      {/* Left panel — branding */}
      <div
        className="hidden md:flex md:w-[44%] lg:w-[42%] flex-col justify-between p-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0b1a3a 0%, #0a1f1a 50%, #071610 100%)',
        }}
      >
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(92,123,255,0.45) 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.5) 0%, transparent 70%)' }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <span className="logo-text text-5xl" style={{ textShadow: '0 0 40px rgba(92,123,255,0.5)' }}>Hangout</span>
          <p className="mt-1 text-xs tracking-widest uppercase text-slate-500 font-medium">Your space to connect</p>
        </div>

        {/* Hero image area */}
        <div className="relative z-10 flex-1 flex items-center justify-center my-8">
          <div
            className="w-full max-w-xs aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(160deg, rgba(92,123,255,0.15) 0%, rgba(74,222,128,0.08) 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <img
              src="https://images.pexels.com/photos/1267244/pexels-photo-1267244.jpeg?auto=compress&cs=tinysrgb&w=600"
              alt="Friends hanging out"
              className="w-full h-full object-cover"
              style={{ filter: 'saturate(0.75) brightness(0.72)' }}
            />
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <p className="text-2xl font-semibold text-white leading-snug">
            Connect, Share,<br />
            <span
              className="font-bold"
              style={{
                background: 'linear-gradient(135deg, #8fa6ff 0%, #4ade80 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Hang out.
            </span>
          </p>
          <p className="mt-2 text-sm text-slate-400">A minimal place to post, yap, and explore.</p>

          <div className="flex gap-1.5 mt-6">
            <span
              className="block h-1.5 rounded-full"
              style={{ width: '32px', background: 'linear-gradient(90deg, #5c7bff, #4ade80)' }}
            />
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 app-bg">
        {/* Mobile logo */}
        <div className="md:hidden mb-8 text-center">
          <span className="logo-text text-5xl" style={{ textShadow: '0 0 40px rgba(92,123,255,0.5)' }}>Hangout</span>
          <p className="mt-1 text-xs tracking-widest uppercase text-slate-500 font-medium">Your space to connect</p>
        </div>

        <div className="w-full max-w-md animate-rise">
          <h1 className="text-3xl font-bold text-white mb-1">
            {mode === 'signup' ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-slate-400 mb-8">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('signin')}
                  className="text-brand-300 hover:text-brand-200 font-medium transition-colors"
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                No account yet?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="text-brand-300 hover:text-brand-200 font-medium transition-colors"
                >
                  Sign up
                </button>
              </>
            )}
          </p>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <UserIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="input pl-9"
                    autoComplete="username"
                    required
                  />
                </div>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="input"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
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
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input pl-9 pr-10"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={busy}
                className="btn-primary w-full py-3 text-sm font-semibold tracking-wide"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-slate-600">
            By continuing you agree to be kind to one another.
          </p>
        </div>
      </div>
    </div>
  );
}
