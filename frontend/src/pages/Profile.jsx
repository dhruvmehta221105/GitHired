import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/useAuth';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  ShieldCheck,
  Target,
  UserRound,
} from 'lucide-react';

const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'U';

const statusStyles = {
  Selected: 'bg-accent/10 text-accent',
  Completed: 'bg-accent/10 text-accent',
  Scheduled: 'bg-amber-50 text-amber-700',
};

export default function Profile() {
  const { user: authUser, logout } = useAuth();
  const [profile, setProfile] = useState(authUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    API.get('/profile')
      .then(({ data }) => {
        if (active) setProfile(data);
      })
      .catch(() => {
        if (active) setError('We could not refresh your profile. Showing your saved account details.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const user = profile || authUser || {};
  const activities = Array.isArray(user.activities) ? user.activities : [];
  const averageScore = Number(user.avgScore) || 0;
  const readiness = Math.min(100, Math.max(0, averageScore));
  const memberSince = formatDate(user.createdAt);
  const displayName = user.name || 'Your profile';

  const summary = useMemo(
    () => [
      {
        label: 'Interviews completed',
        value: user.totalInterviews || 0,
        icon: BarChart3,
        detail: 'Practice sessions',
      },
      {
        label: 'Average score',
        value: averageScore ? `${averageScore}%` : '--',
        icon: Target,
        detail: 'Across completed sessions',
      },
      {
        label: 'Selected outcomes',
        value: user.selected || 0,
        icon: CheckCircle2,
        detail: 'Strong interview results',
      },
    ],
    [averageScore, user.selected, user.totalInterviews],
  );

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-secondary">
          <div className="w-5 h-5 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
          Loading your profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-bg-card">
        <div className="max-w-[1200px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link to="/interviews" className="flex items-center gap-2 text-text-secondary hover:text-text transition-colors">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to dashboard
          </Link>
          <button
            type="button"
            onClick={logout}
            className="text-[13px] font-semibold text-text-secondary hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-10 lg:py-14">
        {error && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            {error}
          </div>
        )}

        <section className="relative overflow-hidden rounded-3xl bg-text p-7 sm:p-10 text-white">
          <div className="absolute -right-20 -top-32 w-80 h-80 rounded-full border border-white/10" />
          <div className="absolute right-16 -bottom-48 w-96 h-96 rounded-full border border-white/10" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center text-2xl font-extrabold shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
                {getInitials(displayName)}
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-[2px] font-semibold text-white/60 mb-2">
                  Candidate profile
                </p>
                <h1 className="text-[30px] sm:text-[38px] font-extrabold tracking-[-1px]">
                  {displayName}
                </h1>
                <p className="mt-2 text-[14px] text-white/70">
                  Keep your profile ready for every opportunity.
                </p>
              </div>
            </div>
            <Link
              to="/schedule-interview"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-[14px] font-semibold hover:bg-accent-dark transition-colors"
            >
              Schedule an interview
              <CalendarDays className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {summary.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-border/60 bg-bg-card p-5">
                <div className="flex items-center gap-2 text-text-secondary mb-4">
                  <Icon className="w-4 h-4 text-accent" />
                  <span className="text-[12px] font-semibold">{item.label}</span>
                </div>
                <div className="text-[30px] font-extrabold tracking-[-1px] text-text">{item.value}</div>
                <p className="text-[12px] text-text-secondary mt-1">{item.detail}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-6 mt-6">
          <section className="rounded-2xl border border-border/60 bg-bg-card p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-[12px] uppercase tracking-[1.5px] font-semibold text-accent mb-2">Recent activity</p>
                <h2 className="text-[22px] font-extrabold text-text tracking-[-0.5px]">Your interview journey</h2>
              </div>
              <Link to="/interviews" className="text-[13px] font-semibold text-accent hover:text-accent-dark">
                View all
              </Link>
            </div>

            {activities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-border text-[11px] uppercase tracking-[1px] text-text-secondary">
                      <th className="pb-3 font-semibold">Role</th>
                      <th className="pb-3 font-semibold">Score</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.slice(0, 6).map((activity, index) => {
                      const status = activity.status || 'Completed';
                      return (
                        <tr key={`${activity.role}-${activity.date}-${index}`} className="border-b border-border/60 last:border-0">
                          <td className="py-4 text-[13px] font-semibold text-text">{activity.role || 'Interview session'}</td>
                          <td className="py-4 text-[13px] font-bold text-text">{activity.score ?? '--'}</td>
                          <td className="py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status] || 'bg-bg-secondary text-text-secondary'}`}>
                              {status}
                            </span>
                          </td>
                          <td className="py-4 text-[13px] text-text-secondary">{formatDate(activity.date)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <Clock3 className="w-7 h-7 text-accent mx-auto mb-3" />
                <p className="text-[14px] font-semibold text-text">Your activity will appear here</p>
                <p className="text-[13px] text-text-secondary mt-1 mb-4">Complete your first mock interview to start tracking progress.</p>
                <Link to="/schedule-interview" className="inline-flex items-center gap-2 text-[13px] font-semibold text-accent">
                  Start practicing <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-border/60 bg-bg-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-text">Interview readiness</h2>
                  <p className="text-[12px] text-text-secondary">Based on your average score</p>
                </div>
              </div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-[32px] font-extrabold text-text">{readiness}%</span>
                <span className="text-[12px] font-semibold text-accent">{readiness >= 75 ? 'On track' : 'Keep practicing'}</span>
              </div>
              <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${readiness}%` }} />
              </div>
              <p className="text-[12px] text-text-secondary mt-4 leading-relaxed">
                Practice consistently and review feedback after every session to improve your readiness.
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 bg-bg-card p-6">
              <h2 className="text-[16px] font-bold text-text mb-5">Account information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <UserRound className="w-4 h-4 text-accent mt-0.5" />
                  <div>
                    <p className="text-[11px] text-text-secondary">Full name</p>
                    <p className="text-[13px] font-semibold text-text mt-0.5">{displayName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-accent mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-text-secondary">Email address</p>
                    <p className="text-[13px] font-semibold text-text mt-0.5 break-all">{user.email || 'Not available'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarDays className="w-4 h-4 text-accent mt-0.5" />
                  <div>
                    <p className="text-[11px] text-text-secondary">Member since</p>
                    <p className="text-[13px] font-semibold text-text mt-0.5">{memberSince}</p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
