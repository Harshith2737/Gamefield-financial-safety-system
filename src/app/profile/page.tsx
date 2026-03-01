'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { createClient } from '@/lib/supabase/client'
import type { Badge, UserBadge, UserScenarioProgress, Scenario } from '@/lib/supabase/types'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Shield, Star, Zap, Trophy, Target, Flame, ArrowLeft,
  Lock, CheckCircle, BarChart3, Calendar, Award
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import AppNav from '@/components/app-nav'

interface BadgeWithEarned extends Badge {
  earned: boolean
  earnedAt?: string
}

interface ProgressWithScenario extends UserScenarioProgress {
  scenario?: Scenario
}

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const [badges, setBadges] = useState<BadgeWithEarned[]>([])
  const [progressData, setProgressData] = useState<ProgressWithScenario[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return
    setLoading(true)

    const [badgesRes, userBadgesRes, progressRes] = await Promise.all([
      supabase.from('badges').select('*').order('requirement_value'),
      supabase.from('user_badges').select('*').eq('user_id', user.id),
      supabase.from('user_scenario_progress').select('*, scenarios(*)').eq('user_id', user.id),
    ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const earnedSet = new Set(userBadgesRes.data?.map((ub: any) => ub.badge_id) || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const earnedMap = new Map(userBadgesRes.data?.map((ub: any) => [ub.badge_id, ub.earned_at]) || [])

      setBadges(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (badgesRes.data || []).map((b: any) => ({
          ...b,
          earned: earnedSet.has(b.id),
          earnedAt: earnedMap.get(b.id),
        }))
      )

      setProgressData(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (progressRes.data || []).map((p: any) => ({
          ...p,
          scenario: (p as any).scenarios,
        }))
      )

    setLoading(false)
  }

  if (!profile) return null

  const xpForNextLevel = (profile.level) * 200
  const xpInCurrentLevel = profile.xp - (profile.level - 1) * 200
  const xpProgress = Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100)
  const completedScenarios = progressData.filter(p => p.status === 'completed')
  const totalCorrect = completedScenarios.reduce((sum, p) => sum + (p.correct_choices || 0), 0)
  const totalChoices = completedScenarios.reduce((sum, p) => sum + (p.total_choices || 0), 0)
  const overallAccuracy = totalChoices > 0 ? Math.round((totalCorrect / totalChoices) * 100) : 0
  const earnedBadges = badges.filter(b => b.earned)

  const CATEGORY_LABELS: Record<string, string> = {
    fake_loan: 'Fake Loan',
    kyc_fraud: 'KYC Fraud',
    refund_scam: 'Refund Scam',
    upi_scam: 'UPI Scam',
    lottery_scam: 'Lottery Scam',
    phishing: 'Phishing',
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-950 px-4 pt-8 pb-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
              {(profile.full_name || profile.username).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">{profile.full_name || profile.username}</h1>
              <p className="text-slate-400 text-sm">@{profile.username}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-medium">
                  Level {profile.level}
                </span>
                {profile.streak_days > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full font-medium flex items-center gap-1">
                    <Flame className="w-3 h-3" /> {profile.streak_days} day streak
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-5 bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium">Level {profile.level} → {profile.level + 1}</span>
              </div>
              <span className="text-sm text-slate-400">{profile.xp} XP total</span>
            </div>
            <Progress value={xpProgress} className="h-2 bg-slate-700" />
            <p className="text-xs text-slate-500 mt-1.5">{xpInCurrentLevel} / {xpForNextLevel} XP to next level</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Target, label: 'Scenarios Played', value: profile.total_scenarios_played, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { icon: BarChart3, label: 'Accuracy', value: `${overallAccuracy}%`, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { icon: Award, label: 'Badges Earned', value: earnedBadges.length, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { icon: Star, label: 'Total XP', value: profile.xp, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className={`rounded-xl border p-4 ${bg}`}>
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Badges Section */}
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Badges
            <span className="text-xs text-slate-500 font-normal ml-1">({earnedBadges.length}/{badges.length} earned)</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {badges.map((badge) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-4 relative overflow-hidden ${
                  badge.earned
                    ? 'bg-gradient-to-br from-amber-950 to-slate-900 border-amber-500/40'
                    : 'bg-slate-900 border-slate-800 opacity-60'
                }`}
              >
                {!badge.earned && (
                  <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-slate-600" />
                  </div>
                )}
                <div className="text-2xl mb-2">{badge.emoji}</div>
                <p className={`text-sm font-semibold ${badge.earned ? 'text-amber-300' : 'text-slate-500'}`}>
                  {badge.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{badge.description}</p>
                {badge.earned && badge.earnedAt && (
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-emerald-400">
                      {new Date(badge.earnedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Scenario History */}
        {completedScenarios.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" /> Completed Scenarios
            </h2>
            <div className="space-y-3">
              {completedScenarios.map((p) => {
                const acc = p.total_choices > 0 ? Math.round((p.correct_choices / p.total_choices) * 100) : 0
                return (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-white truncate">{(p as any).scenarios?.title || 'Scenario'}</p>
                        <p className="text-xs text-slate-500 mt-0.5 capitalize">
                          {CATEGORY_LABELS[(p as any).scenarios?.category || ''] || 'General'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-emerald-400">{acc}%</p>
                        <p className="text-xs text-slate-500">{p.score} XP</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress value={acc} className="h-1.5 bg-slate-700" />
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      {p.correct_choices}/{p.total_choices} correct choices
                      {p.completed_at && ` • ${new Date(p.completed_at).toLocaleDateString('en-IN')}`}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <AppNav active="profile" />
    </div>
  )
}
