import { useState } from 'react';
import { Sparkles, Check, X, Loader2, Trophy, ArrowRight } from 'lucide-react';
import { useTrivia, useTriviaAnswers, useLeaderboard, submitTriviaAnswer } from '../lib/hooks';
import { useAuth } from '../lib/auth';
import { Avatar } from '../components/Avatar';
import { useRouter } from '../lib/router';
import { cn } from '../lib/utils';
import type { TriviaQuestion } from '../lib/types';

export function TriviaPage() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const { questions, loading } = useTrivia();
  const { answered, reload: reloadAnswers } = useTriviaAnswers(user?.id ?? null);
  const { rows, reload: reloadBoard } = useLeaderboard();
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: boolean; error: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<TriviaQuestion | null>(null);

  const answeredIds = new Set(answered.map((a) => a.question_id));
  const current = questions.find((q) => !answeredIds.has(q.id)) ?? null;
  const total = (profile?.aura_plus ?? 0) - (profile?.aura_minus ?? 0);

  const choose = async (idx: number) => {
    if (!user || !current || busy) return;
    setActiveQuestion(current);
    setPicked(idx);
    setBusy(true);
    const res = await submitTriviaAnswer(user.id, current, idx);
    setResult(res);
    setBusy(false);
    if (!res.error) {
      reloadAnswers();
      reloadBoard();
    }
  };

  const next = () => {
    setPicked(null);
    setResult(null);
    setActiveQuestion(null);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
      {/* Aura score header */}
      <header className="card mb-6 flex items-center gap-4 p-5" style={{ backgroundImage: 'linear-gradient(135deg, rgba(92,123,255,0.14) 0%, rgba(74,222,128,0.06) 100%)' }}>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' }}>
          <Sparkles size={20} className="text-white" />
        </span>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-slate-500">Your Aura Points</p>
          <p className="text-2xl font-semibold text-slate-100">{total}</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p><span className="text-mint-400">+{profile?.aura_plus ?? 0}</span> earned</p>
          <p><span className="text-rose-400">-{profile?.aura_minus ?? 0}</span> missed</p>
        </div>
      </header>

      {/* Question */}
      <section className="card mb-6 p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-100">Trivia question</h2>
        {loading && (
          <div className="flex justify-center py-10 text-slate-500"><Loader2 className="animate-spin" /></div>
        )}
        {!loading && !current && !activeQuestion && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Trophy className="text-mint-400" />
            <p className="text-sm text-slate-300">You've answered all the questions!</p>
            <p className="text-xs text-slate-500">Check back later for more trivia.</p>
          </div>
        )}
        {!loading && (current || activeQuestion) && (() => {
          const q = result ? activeQuestion! : current!;
          return (
          <>
            {q.category && (
              <span className="mb-2 inline-block rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-300">{q.category}</span>
            )}
            <p className="text-base font-medium leading-relaxed text-slate-100">{q.question}</p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {q.options.map((opt, i) => {
                const isPicked = picked === i;
                const reveal = result !== null;
                const isCorrect = i === q.correct_index;
                return (
                  <button
                    key={i}
                    disabled={busy || reveal}
                    onClick={() => choose(i)}
                    className={cn(
                      'flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all',
                      !reveal && 'border-white/5 bg-ink-900/40 text-slate-200 hover:border-brand-400/40 hover:bg-white/5',
                      reveal && isCorrect && 'border-mint-400/60 bg-mint-400/10 text-mint-300',
                      reveal && isPicked && !isCorrect && 'border-rose-400/60 bg-rose-400/10 text-rose-300',
                      reveal && !isPicked && !isCorrect && 'border-white/5 bg-ink-900/40 text-slate-500',
                    )}
                  >
                    <span>{opt}</span>
                    {reveal && isCorrect && <Check size={16} className="text-mint-400" />}
                    {reveal && isPicked && !isCorrect && <X size={16} className="text-rose-400" />}
                  </button>
                );
              })}
            </div>
            {result && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-ink-900/40 px-4 py-3 animate-fade-in">
                <p className={cn('text-sm font-medium', result.correct ? 'text-mint-300' : 'text-rose-300')}>
                  {result.error ? result.error : result.correct ? 'Correct! +10 Aura' : 'Oops, -1 Aura'}
                </p>
                <button onClick={next} className="btn-primary !py-1.5 text-xs">
                  Next <ArrowRight size={14} />
                </button>
              </div>
            )}
          </>
          );
        })()}
      </section>

      {/* Leaderboard */}
      <section className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <Trophy size={16} className="text-brand-300" />
          <h2 className="text-sm font-semibold text-slate-100">Aura Leaderboard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2 font-medium">Rank</th>
                <th className="px-4 py-2 font-medium">User</th>
                <th className="px-4 py-2 text-right font-medium">Aura +</th>
                <th className="px-4 py-2 text-right font-medium">Aura -</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-500">No aura earned yet.</td></tr>
              )}
              {rows.map((r, i) => {
                const me = r.user_id === user?.id;
                return (
                  <tr
                    key={r.user_id}
                    className={cn('border-t border-white/5', me && 'bg-brand-400/5')}
                  >
                    <td className="px-4 py-2.5">
                      <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold', i === 0 ? 'bg-amber-400/20 text-amber-300' : i === 1 ? 'bg-slate-300/20 text-slate-200' : i === 2 ? 'bg-orange-400/20 text-orange-300' : 'text-slate-500')}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => navigate({ name: 'profile', userId: r.user_id })} className="flex items-center gap-2 text-left">
                        <Avatar url={r.avatar_url} name={r.username} size={26} />
                        <span className={cn('truncate text-xs', me ? 'font-semibold text-brand-300' : 'text-slate-200')}>{r.full_name || r.username}</span>
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-mint-400">+{r.aura_plus}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-rose-400">-{r.aura_minus}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold text-slate-100">{r.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
