import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import TokenBalance from '../components/TokenBalance'
import {
  Play,
  BarChart3,
  History,
  User,
  Settings,
  Crown,
  TrendingUp,
  Clock,
  Award,
  Zap,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Target,
} from 'lucide-react'

const NAV_LINKS = [
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/session/setup', icon: Play, label: 'New Session' },
  { to: '/history', icon: History, label: 'Reports' },
  { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const Dashboard = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [stats] = useState({
    totalInterviews: 12,
    averageScore: 78,
    bestScore: 92,
    recentInterviews: [
      { id: 1, role: 'Frontend Developer', score: 85, date: '2024-01-15', type: 'Technical' },
      { id: 2, role: 'Product Manager', score: 78, date: '2024-01-14', type: 'HR' },
      { id: 3, role: 'Backend Developer', score: 92, date: '2024-01-13', type: 'Technical' },
    ],
  })

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const scoreColor = (s) =>
    s >= 80 ? 'text-emerald-500' : s >= 60 ? 'text-amber-500' : 'text-red-500'

  const scoreBg = (s) =>
    s >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : s >= 60 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'

  return (
    <div className="min-h-screen flex" style={{ background: 'hsl(var(--background))' }}>

      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-white/5 sticky top-0 h-screen"
        style={{ background: 'hsl(var(--card))' }}>

        {/* Logo */}
        <div className="px-6 py-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
              Interviewmate
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV_LINKS.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`nav-link ${active ? 'active' : ''}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                {active && <ChevronRight className="h-3 w-3 ml-auto opacity-50" />}
              </Link>
            )
          })}
        </nav>

        {/* Token balance + upgrade card */}
        <div className="p-4 space-y-3">
          <div className="rounded-xl p-4 border" style={{ background: 'hsl(var(--secondary))', borderColor: 'hsl(var(--border))' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Token Balance
            </p>
            <TokenBalance />
          </div>

          {(!user?.subscription || user?.subscription === 'free') && (
            <div className="relative rounded-2xl p-4 overflow-hidden text-primary-foreground"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, #f59e0b 100%)' }}>
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
              <div className="relative">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Crown className="h-3.5 w-3.5 text-yellow-200" />
                  <span className="text-xs font-black uppercase tracking-widest text-white/90">Pro Plan</span>
                </div>
                <p className="text-[11px] text-white/70 mb-3 leading-relaxed">Unlimited interviews & advanced analytics</p>
                <Button size="sm" variant="secondary"
                  className="w-full text-xs font-bold h-8 rounded-lg bg-white/20 hover:bg-white/30 text-white border-0">
                  Upgrade Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Topbar */}
        <header className="px-8 py-4 border-b flex items-center justify-between sticky top-0 z-10 glass"
          style={{ borderColor: 'hsl(var(--border))' }}>
          <div>
            <h1 className="text-xl font-heading font-bold tracking-tight">
              {getGreeting()}, <span style={{ color: 'hsl(var(--primary))' }}>{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Ready to sharpen your interview skills?
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/session/setup">
              <Button className="h-9 px-5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all gap-2">
                <Play className="h-3.5 w-3.5" />
                New Session
              </Button>
            </Link>
            <div className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-8 space-y-8 overflow-auto">

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="Total Sessions"
              value={stats.totalInterviews}
              sub="+2 this week"
              accent="from-blue-500/10 to-blue-500/5"
              iconBg="bg-blue-500/15 text-blue-500"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Average Score"
              value={`${stats.averageScore}%`}
              sub="↑ 4pts from last week"
              accent="from-emerald-500/10 to-emerald-500/5"
              iconBg="bg-emerald-500/15 text-emerald-500"
            />
            <StatCard
              icon={<Award className="h-5 w-5" />}
              label="Best Score"
              value={`${stats.bestScore}%`}
              sub="Backend Developer"
              accent="from-amber-500/10 to-amber-500/5"
              iconBg="bg-amber-500/15 text-amber-500"
            />
            <StatCard
              icon={<Target className="h-5 w-5" />}
              label="Token Balance"
              value={user?.tokenBalance ?? '—'}
              sub="Available to use"
              accent="from-primary/10 to-primary/5"
              iconBg="bg-primary/15 text-primary"
            />
          </div>

          {/* ── Quick actions ── */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { to: '/session/setup', icon: <Zap className="h-5 w-5" />, label: 'Start Interview', desc: 'Launch a new live session', primary: true },
                { to: '/history', icon: <History className="h-5 w-5" />, label: 'View Reports', desc: 'Review past sessions' },
                { to: '/analytics', icon: <BarChart3 className="h-5 w-5" />, label: 'Analytics', desc: 'Track your improvement' },
              ].map(({ to, icon, label, desc, primary }) => (
                <Link key={to} to={to}>
                  <div className={`group rounded-2xl p-5 border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl
                    ${primary ? 'border-primary/30 bg-primary/5 hover:bg-primary/10' : 'border-white/5 hover:border-primary/20'}`}
                    style={!primary ? { background: 'hsl(var(--card))' } : {}}>
                    <div className={`inline-flex p-2.5 rounded-xl mb-3 transition-transform group-hover:scale-110
                      ${primary ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-secondary'}`}>
                      {icon}
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-heading font-bold text-sm">{label}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{desc}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity shrink-0 mt-0.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Recent sessions ── */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
              <h2 className="font-heading font-bold">Recent Sessions</h2>
              <Link to="/history">
                <Button variant="ghost" size="sm" className="text-xs gap-1 rounded-lg h-7">
                  View all <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            {stats.recentInterviews.length > 0 ? (
              <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                {stats.recentInterviews.map((iv, i) => (
                  <div key={iv.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors group animate-fade-up"
                    style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex items-center gap-4">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black border ${scoreBg(iv.score)}`}>
                        <span className={scoreColor(iv.score)}>{iv.score}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{iv.role}</p>
                        <p className="text-xs capitalize mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {iv.type} · {iv.date}
                        </p>
                      </div>
                    </div>
                    <Link to={`/report/${iv.id}`}>
                      <Button variant="ghost" size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7 rounded-lg gap-1">
                        Report <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center">
                  <Play className="h-7 w-7" style={{ color: 'hsl(var(--muted-foreground))' }} />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">No sessions yet</p>
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Start your first interview to see results here
                  </p>
                </div>
                <Link to="/session/setup">
                  <Button size="sm" className="rounded-xl h-8 text-xs px-4">
                    Start First Session
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────── */

function StatCard({ icon, label, value, sub, iconBg, accent }) {
  return (
    <div className={`stat-card bg-gradient-to-br ${accent}`}>
      <div className={`inline-flex p-2 rounded-xl ${iconBg} w-fit`}>
        {icon}
      </div>
      <p className="text-2xl font-heading font-extrabold tracking-tight mt-1">{value}</p>
      <p className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{label}</p>
      <p className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{sub}</p>
    </div>
  )
}

export default Dashboard