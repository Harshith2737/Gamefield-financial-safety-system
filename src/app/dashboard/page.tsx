'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { SCENARIOS } from '@/lib/scenarios'
import type { UserScenarioProgress } from '@/lib/supabase/types'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Shield, Zap, LogOut, ChevronRight, Lock,
  CheckCircle, Star, ArrowRight, Search, User, Flame
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import AppNav from '@/components/app-nav'
import { toast } from 'sonner'

const CATEGORY_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  fake_loan:    { bg: 'from-orange-950 to-slate-900', border: 'border-orange-500/30', badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  kyc_fraud:    { bg: 'from-red-950 to-slate-900',    border: 'border-red-500/30',    badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
  refund_scam:  { bg: 'from-amber-950 to-slate-900',  border: 'border-amber-500/30',  badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  upi_scam:     { bg: 'from-purple-950 to-slate-900', border: 'border-purple-500/30', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  lottery_scam: { bg: 'from-pink-950 to-slate-900',   border: 'border-pink-500/30',   badge: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  phishing:     { bg: 'from-blue-950 to-slate-900',   border: 'border-blue-500/30',   badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
}

const DIFFICULTY_LABELS = {
  beginner: { label: 'Beginner', color: 'text-emerald-400' },
  intermediate: { label: 'Intermediate', color: 'text-amber-400' },
  advanced: { label: 'Advanced', color: 'text-red-400' },
}

const CATEGORY_LABELS: Record<string, string> = {
  fake_loan:    'Fake Loan',
  kyc_fraud:    'KYC Fraud',
  refund_scam:  'Refund Scam',
  upi_scam:     'UPI Scam',
  lottery_scam: 'Lottery Scam',
  phishing:     'Phishing',
}

export default function Dashboard() {
  const { user, profile, signOut, loading } = useAuth()
  const [progressMap, setProgressMap] = useState<Map<string, UserScenarioProgress>>(new Map())
  const [loadingData, setLoadingData] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user) fetchProgress()
  }, [user])

  const fetchProgress = async () => {
    if (!user) return
    const { data: dbScenarios } = await supabase.from('scenarios').select('id, slug')
    const { data: progressData } = await supabase
      .from('user_scenario_progress')
      .select('*')
      .eq('user_id', user.id)

    if (dbScenarios && progressData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const slugToId = new Map(dbScenarios.map((s: any) => [s.slug, s.id]))
        const map = new Map<string, UserScenarioProgress>()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        progressData.forEach((p: any) => {
          const slug = [...slugToId.entries()].find(([, id]: [string, string]) => id === p.scenario_id)?.[0]
          if (slug) map.set(slug, p)
        })
      setProgressMap(map)
    }
    setLoadingData(false)
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    router.push('/login')
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Shield className="w-10 h-10 text-emerald-400 animate-pulse" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  const completedCount = [...progressMap.values()].filter(p => p.status === 'completed').length
  const totalScenarios = SCENARIOS.length
  const overallProgress = Math.round((completedCount / totalScenarios) * 100)
  const xpForNextLevel = profile.level * 200
  const xpInCurrentLevel = profile.xp - (profile.level - 1) * 200
  const xpProgress = Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100)

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-950 px-4 pt-6 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-400" />
              <span className="font-bold text-lg text-white">FinShield</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/profile">
                <button className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <User className="w-4 h-4 text-slate-300" />
                </button>
              </Link>
              <button onClick={handleSignOut} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <LogOut className="w-4 h-4 text-slate-300" />
              </button>
            </div>
          </div>

          {/* Welcome */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-white">
              Hi, {profile.full_name?.split(' ')[0] || profile.username}! 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {completedCount === 0
                ? 'Start your first scenario to build scam awareness.'
                : completedCount === totalScenarios
                ? 'You have completed all scenarios! Try Quick Check next.'
                : `${totalScenarios - completedCount} scenarios remaining.`}
            </p>
          </div>

          {/* Level + XP Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-bold text-white text-lg">
                  {profile.level}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Level {profile.level}</p>
                  <p className="text-xs text-slate-400">{profile.xp} XP total</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {profile.streak_days > 0 && (
                  <div className="flex items-center gap-1.5 text-orange-400">
                    <Flame className="w-4 h-4" />
                    <span className="text-sm font-semibold">{profile.streak_days}</span>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-400">{completedCount}/{totalScenarios}</p>
                  <p className="text-xs text-slate-400">complete</p>
                </div>
              </div>
            </div>
            <Progress value={xpProgress} className="h-2 bg-slate-700" />
            <p className="text-xs text-slate-500 mt-1.5">{xpInCurrentLevel}/{xpForNextLevel} XP to Level {profile.level + 1}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-6 -mt-3">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/quick-check">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-blue-900 to-slate-900 border border-blue-500/30 rounded-2xl p-4 h-full"
            >
              <Search className="w-6 h-6 text-blue-400 mb-2" />
              <p className="font-semibold text-white text-sm">Quick Check</p>
              <p className="text-xs text-slate-400 mt-0.5">Verify suspicious messages instantly</p>
              <div className="flex items-center gap-1 mt-3 text-blue-400">
                <span className="text-xs font-medium">Try now</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>
          </Link>

          <Link href="/profile">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-purple-900 to-slate-900 border border-purple-500/30 rounded-2xl p-4 h-full"
            >
              <Star className="w-6 h-6 text-purple-400 mb-2" />
              <p className="font-semibold text-white text-sm">My Badges</p>
              <p className="text-xs text-slate-400 mt-0.5">Track your achievements</p>
              <div className="flex items-center gap-1 mt-3 text-purple-400">
                <span className="text-xs font-medium">View all</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Scenario Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-base">Training Scenarios</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>{completedCount} done</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>Overall progress</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2 bg-slate-800" />
          </div>

          <div className="space-y-3">
            {SCENARIOS.map((scenario, index) => {
              const progress = progressMap.get(scenario.slug)
              const isCompleted = progress?.status === 'completed'
              const colors = CATEGORY_COLORS[scenario.category] || CATEGORY_COLORS.phishing
              const diffConfig = DIFFICULTY_LABELS[scenario.difficulty]
              const accuracy = progress && progress.total_choices > 0
                ? Math.round((progress.correct_choices / progress.total_choices) * 100)
                : null

              return (
                <motion.div
                  key={scenario.slug}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/scenario/${scenario.slug}`}>
                    <div className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-2xl p-4 hover:border-opacity-60 transition-all group`}>
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{scenario.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-sm group-hover:text-emerald-300 transition-colors">
                                {scenario.title}
                              </h3>
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{scenario.description}</p>
                            </div>
                            <div className="shrink-0">
                              {isCompleted
                                ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                                : <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                              }
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${colors.badge}`}>
                              {CATEGORY_LABELS[scenario.category]}
                            </span>
                            <span className={`text-xs font-medium ${diffConfig.color}`}>
                              {diffConfig.label}
                            </span>
                            <div className="flex items-center gap-1 ml-auto">
                              <Zap className="w-3 h-3 text-amber-400" />
                              <span className="text-xs text-amber-400 font-medium">{scenario.xpReward} XP</span>
                            </div>
                          </div>

                          {isCompleted && accuracy !== null && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-500">Score</span>
                                <span className={`font-semibold ${accuracy === 100 ? 'text-emerald-400' : accuracy >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                                  {accuracy}%
                                </span>
                              </div>
                              <Progress value={accuracy} className="h-1 bg-slate-700" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Safety Tip of the Day */}
        <div className="bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Safety Tip of the Day</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {[
              'Your UPI PIN is only for sending money. No one — not even your bank — should ever ask for it.',
              'Scanning a QR code always means you are PAYING someone. You cannot receive money by scanning.',
              'Real banks never send app updates or security patches via WhatsApp or SMS links.',
              'Receiving a refund requires ZERO action from you. It is processed automatically by NPCI.',
              'If someone calls claiming to be from your bank, hang up and call the official number yourself.',
              'Government lotteries in India do not exist. Any "PM Lottery" message is a scam.',
              'Never install APK files from outside the Google Play Store or Apple App Store.',
            ][new Date().getDay() % 7]}
          </p>
          <Link href="/quick-check">
            <button className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
              Check a suspicious message <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </div>

      <AppNav active="dashboard" />
    </div>
  )
}
