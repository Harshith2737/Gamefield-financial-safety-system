'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { SCENARIOS, getScenarioBySlug, getEntryStep, getStepById, type ScenarioData, type ScenarioStep, type ScenarioChoice } from '@/lib/scenarios'
import { toast } from 'sonner'
import {
  Shield, AlertTriangle, CheckCircle, XCircle, MessageSquare,
  Phone, Mail, Smartphone, ArrowRight, Star, Zap, Trophy,
  ChevronRight, Flag, RotateCcw, Home, Info, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

// Message type icons and styles
const MESSAGE_CONFIG = {
  sms: { icon: MessageSquare, label: 'SMS', bg: 'bg-slate-800', border: 'border-slate-600', accent: 'bg-slate-700' },
  call: { icon: Phone, label: 'Phone Call', bg: 'bg-green-950', border: 'border-green-800', accent: 'bg-green-900' },
  whatsapp: { icon: MessageSquare, label: 'WhatsApp', bg: 'bg-green-950', border: 'border-green-700', accent: 'bg-green-900' },
  email: { icon: Mail, label: 'Email', bg: 'bg-blue-950', border: 'border-blue-800', accent: 'bg-blue-900' },
  app_screen: { icon: Smartphone, label: 'App Screen', bg: 'bg-indigo-950', border: 'border-indigo-800', accent: 'bg-indigo-900' },
  popup: { icon: AlertTriangle, label: 'Alert', bg: 'bg-amber-950', border: 'border-amber-800', accent: 'bg-amber-900' },
}

const DIFFICULTY_CONFIG = {
  beginner: { label: 'Beginner', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
  intermediate: { label: 'Intermediate', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
  advanced: { label: 'Advanced', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
}

interface ScenarioResult {
  totalChoices: number
  correctChoices: number
  xpEarned: number
  isPerfect: boolean
}

export default function ScenarioEngine({ slug }: { slug: string }) {
  const scenario = getScenarioBySlug(slug)
  const [currentStep, setCurrentStep] = useState<ScenarioStep | null>(null)
  const [selectedChoice, setSelectedChoice] = useState<ScenarioChoice | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [result, setResult] = useState<ScenarioResult>({ totalChoices: 0, correctChoices: 0, xpEarned: 0, isPerfect: false })
  const [isComplete, setIsComplete] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [progress, setProgress] = useState(0)
  const { user, refreshProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (scenario) {
      const entry = getEntryStep(scenario)
      setCurrentStep(entry || null)
    }
  }, [scenario])

  useEffect(() => {
    if (scenario && currentStep) {
      const stepIndex = scenario.steps.findIndex(s => s.id === currentStep.id)
      // Find non-bad steps for progress calculation
      const mainSteps = scenario.steps.filter(s => !s.id.includes('bad'))
      const currentMainIndex = mainSteps.findIndex(s => s.id === currentStep.id)
      const pct = mainSteps.length > 0 ? ((currentMainIndex + 1) / (mainSteps.length + 1)) * 100 : 0
      setProgress(Math.max(progress, pct))
    }
  }, [currentStep, scenario])

  if (!scenario) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Scenario not found</h2>
          <Link href="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
        </div>
      </div>
    )
  }

  const handleChoiceSelect = async (choice: ScenarioChoice) => {
    setSelectedChoice(choice)
    setShowFeedback(true)

    const newResult = {
      ...result,
      totalChoices: result.totalChoices + 1,
      correctChoices: result.correctChoices + (choice.isSafe ? 1 : 0),
      xpEarned: result.xpEarned + choice.xpGained,
    }
    setResult(newResult)
  }

  const handleContinue = async () => {
    if (!selectedChoice) return

    if (selectedChoice.isTerminal) {
      // Scenario complete
      const isPerfect = result.correctChoices + (selectedChoice.isSafe ? 1 : 0) === result.totalChoices + 1
      const finalResult = { ...result, isPerfect }
      setResult(finalResult)
      setIsComplete(true)
      setProgress(100)
      await saveProgress(finalResult)
    } else if (selectedChoice.nextStepId) {
      const nextStep = getStepById(scenario, selectedChoice.nextStepId)
      if (nextStep) {
        setCurrentStep(nextStep)
        setSelectedChoice(null)
        setShowFeedback(false)
      }
    }
  }

  const saveProgress = async (finalResult: ScenarioResult) => {
    if (!user) return
    try {
      // Get scenario ID from DB
      const { data: scenarioData } = await supabase
        .from('scenarios')
        .select('id')
        .eq('slug', slug)
        .single()

      if (scenarioData) {
        await supabase.from('user_scenario_progress').upsert({
          user_id: user.id,
          scenario_id: scenarioData.id,
          status: 'completed',
          score: finalResult.xpEarned,
          correct_choices: finalResult.correctChoices,
          total_choices: finalResult.totalChoices,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,scenario_id' })

        // Update profile XP and stats
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (profile) {
          const newXp = profile.xp + finalResult.xpEarned
          const newLevel = Math.floor(newXp / 200) + 1
          await supabase.from('profiles').update({
            xp: newXp,
            level: newLevel,
            total_scenarios_played: profile.total_scenarios_played + 1,
            total_correct_choices: profile.total_correct_choices + finalResult.correctChoices,
            last_played_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('id', user.id)

          // Check and award badges
          await checkAndAwardBadges(user.id, profile.total_scenarios_played + 1, newXp, newLevel, finalResult.isPerfect)
        }
        await refreshProfile()
      }
    } catch (e) {
      console.error('Failed to save progress', e)
    }
  }

  const checkAndAwardBadges = async (userId: string, scenariosPlayed: number, xp: number, level: number, isPerfect: boolean) => {
    const { data: allBadges } = await supabase.from('badges').select('*')
    const { data: userBadges } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId)
    const earnedIds = new Set(userBadges?.map(b => b.badge_id) || [])

    const toAward = allBadges?.filter(badge => {
      if (earnedIds.has(badge.id)) return false
      if (badge.requirement_type === 'scenarios_completed') return scenariosPlayed >= badge.requirement_value
      if (badge.requirement_type === 'total_xp') return xp >= badge.requirement_value
      if (badge.requirement_type === 'level_reached') return level >= badge.requirement_value
      if (badge.requirement_type === 'perfect_score') return isPerfect
      return false
    }) || []

    for (const badge of toAward) {
      await supabase.from('user_badges').insert({ user_id: userId, badge_id: badge.id })
      toast.success(`Badge Earned: ${badge.emoji} ${badge.name}!`, { duration: 4000 })
    }
  }

  const handleRestart = () => {
    const entry = getEntryStep(scenario)
    setCurrentStep(entry || null)
    setSelectedChoice(null)
    setShowFeedback(false)
    setResult({ totalChoices: 0, correctChoices: 0, xpEarned: 0, isPerfect: false })
    setIsComplete(false)
    setProgress(0)
  }

  const diffConfig = DIFFICULTY_CONFIG[scenario.difficulty]
  const msgConfig = currentStep ? MESSAGE_CONFIG[currentStep.messageType] : null
  const MsgIcon = msgConfig?.icon || MessageSquare
  const accuracy = result.totalChoices > 0 ? Math.round((result.correctChoices / result.totalChoices) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Home className="w-4 h-4 text-slate-400" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm truncate">{scenario.emoji} {scenario.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-medium ${diffConfig.color}`}>{diffConfig.label}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-500">{scenario.xpReward} XP max</span>
            </div>
          </div>
          <button
            onClick={() => setShowTips(!showTips)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-2">
          <Progress value={progress} className="h-1.5 bg-slate-800" />
        </div>
      </div>

      {/* Tips Panel */}
      <AnimatePresence>
        {showTips && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl mx-auto px-4 pt-4"
          >
            <div className="bg-blue-950/80 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-blue-300 text-sm">Safety Tips</span>
                </div>
                <button onClick={() => setShowTips(false)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <ul className="space-y-2">
                {scenario.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <AnimatePresence mode="wait">
          {!isComplete ? (
            <motion.div key={currentStep?.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              {/* Message Card */}
              {currentStep && msgConfig && (
                <div className={`rounded-2xl border ${msgConfig.bg} ${msgConfig.border} overflow-hidden`}>
                  {/* Message Header */}
                  <div className={`px-4 py-3 ${msgConfig.accent} border-b ${msgConfig.border} flex items-center gap-3`}>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <MsgIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{currentStep.sender}</p>
                      {currentStep.senderHandle && (
                        <p className="text-xs text-slate-400 font-mono">{currentStep.senderHandle}</p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300">{msgConfig.label}</span>
                  </div>

                  {/* Message Content */}
                  <div className="p-5">
                    <p className="text-slate-200 text-sm whitespace-pre-line leading-relaxed">{currentStep.content}</p>
                    {currentStep.contextNote && (
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-500 italic">{currentStep.contextNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Choices */}
              {!showFeedback && currentStep && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400 font-medium">What do you do?</p>
                  {currentStep.choices.map((choice, i) => (
                    <motion.button
                      key={choice.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleChoiceSelect(choice)}
                      className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-slate-400 group-hover:text-white shrink-0 mt-0.5">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-sm text-slate-300 group-hover:text-white leading-relaxed">{choice.text}</span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white ml-auto shrink-0 mt-0.5" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Feedback Panel */}
              <AnimatePresence>
                {showFeedback && selectedChoice && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-2xl border overflow-hidden ${
                      selectedChoice.isSafe
                        ? 'bg-emerald-950 border-emerald-500/40'
                        : 'bg-red-950 border-red-500/40'
                    }`}
                  >
                    {/* Feedback Header */}
                    <div className={`px-5 py-4 border-b ${selectedChoice.isSafe ? 'border-emerald-500/30 bg-emerald-900/40' : 'border-red-500/30 bg-red-900/40'}`}>
                      <div className="flex items-center gap-3">
                        {selectedChoice.isSafe
                          ? <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                          : <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                        }
                        <div>
                          <h3 className={`font-bold text-base ${selectedChoice.isSafe ? 'text-emerald-300' : 'text-red-300'}`}>
                            {selectedChoice.feedbackTitle}
                          </h3>
                          {selectedChoice.xpGained > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Zap className="w-3 h-3 text-amber-400" />
                              <span className="text-xs text-amber-400 font-semibold">+{selectedChoice.xpGained} XP earned</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <p className="text-sm text-slate-300 leading-relaxed">{selectedChoice.feedbackExplanation}</p>

                      {/* Red Flags */}
                      {!selectedChoice.isSafe && selectedChoice.redFlags && selectedChoice.redFlags.length > 0 && (
                        <div className="bg-red-900/30 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Flag className="w-4 h-4 text-red-400" />
                            <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Red Flags Missed</span>
                          </div>
                          <ul className="space-y-1.5">
                            {selectedChoice.redFlags.map((flag, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                                <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                                <span>{flag}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Button
                        onClick={handleContinue}
                        className={`w-full h-11 font-semibold gap-2 ${selectedChoice.isSafe ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900' : 'bg-red-500 hover:bg-red-400 text-white'}`}
                      >
                        {selectedChoice.isTerminal ? (
                          <>See Results <Trophy className="w-4 h-4" /></>
                        ) : (
                          <>Continue <ArrowRight className="w-4 h-4" /></>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            // Completion Screen
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Score Header */}
              <div className={`rounded-2xl p-8 text-center border ${
                result.isPerfect
                  ? 'bg-gradient-to-b from-amber-900/50 to-amber-950 border-amber-500/40'
                  : accuracy >= 60
                  ? 'bg-gradient-to-b from-emerald-900/50 to-emerald-950 border-emerald-500/40'
                  : 'bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700'
              }`}>
                <div className="text-6xl mb-3">
                  {result.isPerfect ? '🏆' : accuracy >= 60 ? '🛡️' : '📚'}
                </div>
                <h2 className="text-2xl font-bold mb-1">
                  {result.isPerfect ? 'Perfect Score!' : accuracy >= 60 ? 'Well Done!' : 'Keep Learning!'}
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  {result.isPerfect
                    ? 'You identified every scam perfectly!'
                    : accuracy >= 60
                    ? 'Good awareness! Review the red flags you missed.'
                    : 'Scams can be tricky. Practice makes perfect.'}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="text-2xl font-bold text-white">{accuracy}%</div>
                    <div className="text-xs text-slate-400 mt-0.5">Accuracy</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="text-2xl font-bold text-amber-400">{result.xpEarned}</div>
                    <div className="text-xs text-slate-400 mt-0.5">XP Earned</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="text-2xl font-bold text-emerald-400">{result.correctChoices}/{result.totalChoices}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Correct</div>
                  </div>
                </div>
              </div>

              {/* Tips Review */}
              <div className="bg-blue-950/50 border border-blue-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <h3 className="font-semibold text-blue-300 text-sm">Key Lessons from This Scenario</h3>
                </div>
                <ul className="space-y-2">
                  {scenario.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button onClick={handleRestart} variant="outline" className="w-full h-11 border-white/20 text-white hover:bg-white/10 gap-2">
                  <RotateCcw className="w-4 h-4" /> Try Again
                </Button>
                <Link href="/dashboard" className="block">
                  <Button className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold gap-2">
                    <Home className="w-4 h-4" /> Back to Dashboard
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
