'use client'

import Link from 'next/link'
import { Home, Search, User, Shield } from 'lucide-react'

interface AppNavProps {
  active: 'dashboard' | 'quick-check' | 'profile'
}

export default function AppNav({ active }: AppNavProps) {
  const items = [
    { id: 'dashboard', href: '/dashboard', icon: Home, label: 'Home' },
    { id: 'quick-check', href: '/quick-check', icon: Search, label: 'Quick Check' },
    { id: 'profile', href: '/profile', icon: User, label: 'Profile' },
  ] as const

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-t border-white/10">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-around py-2">
        {items.map(({ id, href, icon: Icon, label }) => {
          const isActive = active === id
          return (
            <Link
              key={id}
              href={href}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
                isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : ''}`} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
