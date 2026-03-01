'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, AlertTriangle, CheckCircle, XCircle, Shield,
  Flag, Lightbulb, RotateCcw, Clipboard, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import AppNav from '@/components/app-nav'

// ─── Heuristic Analysis Engine ───────────────────────────────────────────────
interface AnalysisResult {
  result: 'safe' | 'suspicious' | 'dangerous'
  riskScore: number
  redFlags: string[]
  safeSignals: string[]
  verdict: string
  advice: string
}

const RED_FLAG_PATTERNS: { pattern: RegExp; label: string; weight: number }[] = [
  { pattern: /upi\s*pin|atm\s*pin|cvv|otp.*share|share.*otp/i, label: 'Asking for PIN/OTP (never share these)', weight: 35 },
  { pattern: /processing\s*fee|registration\s*fee|verification\s*fee|tax.*pay|pay.*fee/i, label: 'Upfront fee required before receiving money', weight: 30 },
  { pattern: /scan.*qr.*receive|qr.*code.*money.*receive/i, label: 'QR code to receive money (impossible — QR sends money)', weight: 30 },
  { pattern: /\.xyz|\.net\/|\.tk|\.ml|bit\.ly|tinyurl|t\.me\/|wa\.me\//i, label: 'Suspicious/shortened URL detected', weight: 20 },
  { pattern: /won.*prize|prize.*won|lottery.*win|winning.*amount|congratulations.*crore|congratulations.*lakh/i, label: 'Lottery/prize win claim (you cannot win what you never entered)', weight: 28 },
  { pattern: /kyc.*block|account.*block.*kyc|block.*hour|block.*24|urgent.*kyc/i, label: 'Threatening account block to create urgency', weight: 25 },
  { pattern: /0%\s*interest|zero.*interest|no\s*document|instant.*approve/i, label: 'Unrealistic loan terms (0% interest, no documents)', weight: 22 },
  { pattern: /apk|download.*app.*link|install.*update.*link/i, label: 'Link to download app/APK outside official store', weight: 28 },
  { pattern: /aadhaar.*number.*share|pan.*number.*call|bank.*detail.*whatsapp/i, label: 'Requesting Aadhaar/PAN/bank details over chat/call', weight: 25 },
  { pattern: /\+91\s*[6-9]\d{9}|91[6-9]\d{9}/i, label: 'Claim from official source but using personal mobile number', weight: 10 },
  { pattern: /limited.*time|expire.*hour|expires.*minute|act\s*now|hurry|immediately/i, label: 'Artificial urgency/time pressure tactic', weight: 15 },
  { pattern: /pm\s*lottery|government.*lottery|rbi.*lottery|sbi.*lottery/i, label: 'Fake government/bank lottery (no such scheme exists)', weight: 30 },
  { pattern: /refund.*pin|pin.*refund|enter.*pin.*credit/i, label: 'PIN required to receive refund (refunds are automatic)', weight: 32 },
  { pattern: /customer.*care.*whatsapp|bank.*helpline.*whatsapp/i, label: 'Bank claiming WhatsApp as official support channel', weight: 20 },
  { pattern: /remote.*access|anydesk|teamviewer.*install/i, label: 'Remote access tool installation request', weight: 35 },
  { pattern: /double.*money|2x.*invest|guaranteed.*return|100.*return/i, label: 'Impossible investment returns guarantee', weight: 28 },
]

const SAFE_SIGNAL_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /https:\/\/[a-z]+\.gov\.in/i, label: 'Official .gov.in government domain' },
  { pattern: /https:\/\/[a-z]+\.(sbi|hdfcbank|icicibank|axisbank|kotak)\.com/i, label: 'Official verified bank domain' },
  { pattern: /1800[0-9]{6,}/i, label: 'Toll-free helpline number (1800-xxx)' },
  { pattern: /play\.google\.com|apps\.apple\.com/i, label: 'Official app store link' },
  { pattern: /npci\.org\.in|upi\.one/i, label: 'Official NPCI/UPI domain' },
]

function analyzeText(text: string): AnalysisResult {
  let riskScore = 0
  const redFlags: string[] = []
  const safeSignals: string[] = []

  for (const { pattern, label, weight } of RED_FLAG_PATTERNS) {
    if (pattern.test(text)) {
      redFlags.push(label)
      riskScore += weight
    }
  }

  for (const { pattern, label } of SAFE_SIGNAL_PATTERNS) {
    if (pattern.test(text)) {
      safeSignals.push(label)
      riskScore = Math.max(0, riskScore - 10)
    }
  }

  riskScore = Math.min(riskScore, 100)

  let result: 'safe' | 'suspicious' | 'dangerous'
  let verdict: string
  let advice: string

  if (riskScore >= 50) {
    result = 'dangerous'
    verdict = 'High probability of scam/fraud'
    advice = 'Do NOT click links, share personal info, or transfer money. Block the sender. Report to 1930 (National Cybercrime Helpline) or cybercrime.gov.in'
  } else if (riskScore >= 20) {
    result = 'suspicious'
    verdict = 'Multiple warning signs detected'
    advice = 'Proceed with extreme caution. Verify by calling official helpline numbers. Never share OTPs, PINs, or personal documents in response to this message.'
  } else {
    result = 'safe'
    verdict = redFlags.length === 0 ? 'No obvious red flags detected' : 'Low risk, but stay alert'
    advice = redFlags.length === 0
      ? 'Message appears safe, but always verify before sharing sensitive information.'
      : 'Some minor signals found. Use official channels to verify any claims.'
  }

  return { result, riskScore, redFlags, safeSignals, verdict, advice }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function QuickCheckPage() {
  const [inputText, setInputText] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      toast.error('Please paste a message or URL to analyze')
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 600)) // simulate analysis
    const result = analyzeText(inputText)
    setAnalysis(result)
    setLoading(false)

    // Log to DB
    if (user) {
      await supabase.from('quick_check_logs').insert({
        user_id: user.id,
        input_text: inputText.substring(0, 500),
        result: result.result,
        risk_score: result.riskScore,
        red_flags_found: result.redFlags,
      })
      // Update quick_checks count for badge tracking via profile notes
      await supabase.from('profiles').update({
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setInputText(text)
      toast.success('Pasted from clipboard')
    } catch {
      toast.error('Could not access clipboard')
    }
  }

  const handleReset = () => {
    setInputText('')
    setAnalysis(null)
  }

  const RESULT_CONFIG = {
    safe: {
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950',
      border: 'border-emerald-500/40',
      headerBg: 'bg-emerald-900/40',
      barColor: 'bg-emerald-500',
      label: 'Likely Safe',
    },
    suspicious: {
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-950',
      border: 'border-amber-500/40',
      headerBg: 'bg-amber-900/40',
      barColor: 'bg-amber-500',
      label: 'Suspicious',
    },
    dangerous: {
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-950',
      border: 'border-red-500/40',
      headerBg: 'bg-red-900/40',
      barColor: 'bg-red-500',
      label: 'Dangerous',
    },
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="bg-slate-900 border-b border-white/10 px-4 py-5">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Search className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Quick Check</h1>
              <p className="text-slate-400 text-xs">Analyze suspicious messages, links, or calls</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Input Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-300">Paste suspicious message or URL</label>
            <button
              onClick={handlePaste}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Clipboard className="w-3.5 h-3.5" /> Paste
            </button>
          </div>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste the message, URL, or describe what you received here...&#10;&#10;Example: 'You have won ₹50 lakh in PM Digital India Lottery...'"
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 resize-none min-h-[140px] text-sm focus:border-blue-500"
          />
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleAnalyze}
              disabled={loading || !inputText.trim()}
              className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-semibold h-11 gap-2"
            >
              {loading ? (
                <><span className="animate-pulse">Analyzing...</span></>
              ) : (
                <><Shield className="w-4 h-4" /> Analyze Now <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
            {analysis && (
              <Button onClick={handleReset} variant="outline" className="border-slate-700 text-slate-400 hover:text-white h-11">
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Analysis Result */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {(() => {
                const cfg = RESULT_CONFIG[analysis.result]
                const ResultIcon = cfg.icon
                return (
                  <>
                    {/* Result Header */}
                    <div className={`rounded-2xl border ${cfg.bg} ${cfg.border} overflow-hidden`}>
                      <div className={`px-5 py-4 ${cfg.headerBg} border-b ${cfg.border}`}>
                        <div className="flex items-center gap-3">
                          <ResultIcon className={`w-7 h-7 ${cfg.color}`} />
                          <div className="flex-1">
                            <h2 className={`text-lg font-bold ${cfg.color}`}>{cfg.label}</h2>
                            <p className="text-sm text-slate-300">{analysis.verdict}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">{analysis.riskScore}</p>
                            <p className="text-xs text-slate-400">Risk Score</p>
                          </div>
                        </div>
                        {/* Risk Bar */}
                        <div className="mt-3 bg-black/20 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${analysis.riskScore}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${cfg.barColor}`}
                          />
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        {/* Red Flags */}
                        {analysis.redFlags.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Flag className="w-4 h-4 text-red-400" />
                              <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Red Flags Detected ({analysis.redFlags.length})</span>
                            </div>
                            <ul className="space-y-2">
                              {analysis.redFlags.map((flag, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-red-300">
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                                  <span>{flag}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Safe Signals */}
                        {analysis.safeSignals.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Safe Signals ({analysis.safeSignals.length})</span>
                            </div>
                            <ul className="space-y-2">
                              {analysis.safeSignals.map((signal, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-emerald-300">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                  <span>{signal}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Advice */}
                        <div className="bg-white/5 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">What to Do</span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">{analysis.advice}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}

              {/* Quick Reference Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Golden Rules of Digital Payments
                </h3>
                <ul className="space-y-2">
                  {[
                    'NEVER share your UPI PIN, OTP, ATM PIN, or CVV with anyone',
                    'QR codes are for SENDING money. You never scan to receive',
                    'Real refunds happen automatically — no PIN required',
                    'Banks contact you through official app notifications, not SMS/WhatsApp',
                    'Download apps only from Google Play Store or Apple App Store',
                    'Report scams: Call 1930 or visit cybercrime.gov.in',
                  ].map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state tips */}
        {!analysis && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" /> What can I check?
            </h3>
            <ul className="space-y-2.5">
              {[
                { emoji: '📱', text: 'Suspicious SMS from unknown numbers' },
                { emoji: '📧', text: 'Emails claiming you won a prize or need KYC' },
                { emoji: '💬', text: 'WhatsApp messages asking for payment or info' },
                { emoji: '🔗', text: 'Links sent by strangers claiming to be from banks' },
                { emoji: '📞', text: 'Script of a suspicious phone call' },
              ].map(({ emoji, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="text-base">{emoji}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <AppNav active="quick-check" />
    </div>
  )
}
