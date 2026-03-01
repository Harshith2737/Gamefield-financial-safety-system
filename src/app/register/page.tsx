'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Shield, Eye, EyeOff, ArrowRight, Lock, Mail, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !username || !fullName) {
      toast.error('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (username.length < 3) {
      toast.error('Username must be at least 3 characters')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: fullName },
      },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      toast.success('Account created! Redirecting...')
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mb-4">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">FinShield</h1>
          <p className="text-slate-400 mt-1 text-sm">Learn to protect yourself from financial scams</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Create your free account</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ravi Kumar" className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="ravikumar" className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-emerald-500" autoComplete="email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-emerald-500" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold h-11 mt-2 gap-2">
              {loading ? 'Creating account...' : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
        <p className="text-center text-slate-600 text-xs mt-6">By creating an account you agree to learn safely. No banking credentials needed.</p>
      </div>
    </div>
  )
}
