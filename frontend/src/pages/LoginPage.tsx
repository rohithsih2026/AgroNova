import { useState } from 'react'
import { ArrowRight, BarChart3, BrainCircuit, Check, Leaf, Map, ShieldCheck, Sprout, Users, Wifi, type LucideIcon } from 'lucide-react'
import { api } from '../services/api'
import type { Role, User } from '../types'
import { Button, DataLabel } from '../components/ui'

const roleOptions: Array<{ role: Role; label: string; description: string; icon: LucideIcon; color: string }> = [
  { role: 'farmer', label: 'Farmer', description: 'Field-level weather and crop decisions', icon: Sprout, color: 'text-emerald-600 bg-emerald-50' },
  { role: 'officer', label: 'Agriculture Officer', description: 'Block monitoring and extension guidance', icon: Users, color: 'text-sky-600 bg-sky-50' },
  { role: 'administrator', label: 'Administrator', description: 'Model, data and platform oversight', icon: ShieldCheck, color: 'text-violet-600 bg-violet-50' },
]

export function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [role, setRole] = useState<Role>('officer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const continueDemo = async () => {
    setLoading(true)
    setError('')
    try {
      const user = await api.login(role)
      onLogin(user)
    } catch {
      setError('The demo session could not be started. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6faf7] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <LoginStory />
      <section className="flex min-h-screen items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-[510px]">
          <MobileBrand />
          <div className="mb-8"><DataLabel /><h2 className="mt-5 text-3xl font-extrabold tracking-tight text-ink">Welcome to the demo</h2><p className="mt-2 text-sm leading-6 text-slate-500">Choose a role to explore the complete block-to-Panchayat decision workflow.</p></div>
          <div className="space-y-3">{roleOptions.map((option) => <RoleButton key={option.role} option={option} active={role === option.role} onClick={() => setRole(option.role)} />)}</div>
          {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</div>}
          <Button size="lg" className="mt-7 w-full" onClick={() => void continueDemo()} disabled={loading}>{loading ? 'Starting demo…' : <>Continue as {roleOptions.find((item) => item.role === role)?.label}<ArrowRight size={17} /></>}</Button>
          <div className="mt-8 grid grid-cols-3 gap-2 border-t border-slate-200 pt-6 text-center text-[10px] text-slate-400"><div className="flex flex-col items-center gap-1"><BrainCircuit size={15} className="text-leaf" />ML ready</div><div className="flex flex-col items-center gap-1"><Map size={15} className="text-sky-500" />GIS aware</div><div className="flex flex-col items-center gap-1"><BarChart3 size={15} className="text-violet-500" />Explainable</div></div>
          <div className="mt-8 text-center text-[10px] text-slate-400">No real credentials required · Synthetic demonstration data only</div>
        </div>
      </section>
    </div>
  )
}

function LoginStory() {
  return <section className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14"><div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-forest/30 blur-3xl" /><div className="absolute -bottom-40 -left-24 h-[500px] w-[500px] rounded-full bg-sky-900/30 blur-3xl" /><div className="relative z-10"><BrandLockup /><div className="mt-24 max-w-xl"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-200"><Wifi size={12} /> SIH prototype · offline-ready demo</div><h1 className="text-5xl font-extrabold leading-[1.08] tracking-[-0.04em] text-white xl:text-6xl">From block weather<br /><span className="text-emerald-300">to field intelligence.</span></h1><p className="mt-6 max-w-md text-sm leading-7 text-white/60">A spatially aware decision-support layer that turns coarse weather signals into explainable, crop-specific advisories for every Panchayat.</p><div className="mt-12 flex items-center gap-8"><StoryStat value="8" label="Demo panchayats" /><StoryStat value="5" label="Weather layers" /><StoryStat value="1" label="Clear workflow" /></div></div></div><div className="relative z-10 flex items-center gap-3 text-[10px] text-white/35"><div className="flex -space-x-2"><span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-emerald-500 text-[9px] font-bold text-white">K</span><span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-sky-500 text-[9px] font-bold text-white">M</span><span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-violet-500 text-[9px] font-bold text-white">A</span></div><span>Built for farmers, extension teams and decision-makers</span></div></section>
}

function BrandLockup() {
  return <div className="flex items-center gap-3"><img src="/logo.png" alt="AgroNova logo" className="h-12 w-12 rounded-xl object-cover object-top opacity-90 ring-1 ring-white/15" /><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-leaf text-white"><Leaf size={23} fill="currentColor" /></div><div><div className="text-lg font-extrabold text-white">AgroNova</div><div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">Panchayat intelligence</div></div></div>
}

function MobileBrand() {
  return <div className="mb-8 flex items-center gap-3 lg:hidden"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest text-white"><Leaf size={21} fill="currentColor" /></div><div><div className="font-extrabold text-ink">AgroNova</div><div className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Panchayat intelligence</div></div></div>
}

function RoleButton({ option, active, onClick }: { option: (typeof roleOptions)[number]; active: boolean; onClick: () => void }) {
  const Icon = option.icon
  return <button onClick={onClick} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${active ? 'border-forest bg-mint shadow-soft' : 'border-slate-200 bg-white hover:border-slate-300'}`}><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${option.color}`}><Icon size={21} /></div><div className="min-w-0 flex-1"><div className="text-sm font-bold text-ink">{option.label}</div><div className="mt-1 text-xs text-slate-500">{option.description}</div></div><div className={`flex h-5 w-5 items-center justify-center rounded-full border ${active ? 'border-forest bg-forest text-white' : 'border-slate-200 text-transparent'}`}><Check size={12} strokeWidth={3} /></div></button>
}

function StoryStat({ value, label }: { value: string; label: string }) {
  return <div><div className="text-2xl font-extrabold text-white">{value}</div><div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div></div>
}
