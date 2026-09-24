import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, Leaf, LoaderCircle, ShieldCheck } from 'lucide-react'
import type { RiskLevel } from '../types'

export function Card({ children, className = '', onClick }: { children?: ReactNode; className?: string; onClick?: () => void }) {
  return <section onClick={onClick} className={`rounded-2xl border border-slate-200/80 bg-white shadow-soft ${onClick ? 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lift' : ''} ${className}`}>{children}</section>
}

export function CardHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-leaf">{eyebrow || 'AgroNova'}</div><h2 className="text-base font-bold tracking-tight text-ink">{title}</h2>{description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}</div>{action}</div>
}

export function Button({ children, variant = 'primary', size = 'md', className = '', onClick, disabled, type = 'button' }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'; size?: 'sm' | 'md' | 'lg'; className?: string; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' }) {
  const variants = { primary: 'bg-forest text-white hover:bg-[#164b38] shadow-sm', secondary: 'border border-slate-200 bg-white text-slate-700 hover:border-leaf hover:text-forest', ghost: 'text-slate-600 hover:bg-slate-50 hover:text-forest', danger: 'bg-danger text-white hover:bg-[#bd3b3b]', dark: 'bg-ink text-white hover:bg-slate-800' }
  const sizes = { sm: 'px-3 py-2 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-5 py-3 text-sm' }
  return <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}>{children}</button>
}

export function DataLabel({ className = '' }: { className?: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 ${className}`}><Info size={11} /> Prototype Demo Data</span>
}

export function RiskBadge({ level, compact = false }: { level: RiskLevel | string; compact?: boolean }) {
  const styles: Record<string, string> = { Normal: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Moderate: 'bg-amber-50 text-amber-700 ring-amber-200', High: 'bg-orange-50 text-orange-700 ring-orange-200', Critical: 'bg-red-50 text-red-700 ring-red-200', Low: 'bg-sky-50 text-sky-700 ring-sky-200' }
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${styles[level] || styles.Moderate} ${compact ? 'px-2 py-0.5 text-[10px]' : ''}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{level}</span>
}

export function ConfidenceMeter({ value, label = 'Prototype model confidence', dark = false }: { value: number; label?: string; dark?: boolean }) {
  const safe = Math.max(0, Math.min(100, value))
  const level = safe >= 80 ? 'High' : safe >= 65 ? 'Medium' : 'Low'
  return <div className={dark ? 'text-white' : ''}><div className="mb-1.5 flex items-center justify-between gap-3 text-[11px]"><span className={dark ? 'text-white/65' : 'text-slate-500'}>{label}</span><span className="font-bold">{safe.toFixed(0)}% · {level}</span></div><div className={`h-1.5 overflow-hidden rounded-full ${dark ? 'bg-white/15' : 'bg-slate-100'}`}><div className={`h-full rounded-full transition-all ${safe >= 80 ? 'bg-emerald-400' : safe >= 65 ? 'bg-amber-400' : 'bg-orange-400'}`} style={{ width: `${safe}%` }} /></div></div>
}

export function MetricCard({ label, value, unit, detail, icon, tone = 'green', trend }: { label: string; value: string | number; unit?: string; detail?: string; icon: ReactNode; tone?: 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'amber'; trend?: string }) {
  const tones = { green: 'bg-emerald-50 text-emerald-600', blue: 'bg-sky-50 text-sky-600', orange: 'bg-orange-50 text-orange-600', red: 'bg-red-50 text-red-600', purple: 'bg-violet-50 text-violet-600', amber: 'bg-amber-50 text-amber-600' }
  return <Card className="relative overflow-hidden p-4"><div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</div><div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</div><div className="mt-1 flex items-baseline gap-1.5"><span className="text-2xl font-extrabold tracking-tight text-ink">{value}</span>{unit && <span className="text-xs font-semibold text-slate-500">{unit}</span>}</div>{detail && <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">{trend && <span className="font-bold text-leaf">{trend}</span>}{detail}</div>}</Card>
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center"><div className="mb-3 rounded-full bg-white p-3 text-slate-400 shadow-sm"><Leaf size={22} /></div><h3 className="text-sm font-bold text-ink">{title}</h3><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{message}</p>{action && <div className="mt-4">{action}</div>}</div>
}

export function LoadingBlock({ label = 'Loading intelligence' }: { label?: string }) {
  return <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white"><div className="flex items-center gap-3 text-sm font-semibold text-slate-500"><LoaderCircle className="animate-spin text-leaf" size={20} />{label}<span className="text-xs text-slate-400">…</span></div></div>
}

export function WhyPanel({ title = 'Why this prediction?', reasons, className = '' }: { title?: string; reasons: string[]; className?: string }) {
  return <div className={`rounded-xl border border-blue-100 bg-blue-50/70 p-4 ${className}`}><div className="mb-2 flex items-center gap-2 text-xs font-bold text-blue-800"><ShieldCheck size={15} />{title}</div><ul className="space-y-2">{reasons.map((reason) => <li key={reason} className="flex gap-2 text-xs leading-5 text-blue-900/75"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-blue-500" />{reason}</li>)}</ul></div>
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-xs text-red-700"><div className="flex items-center gap-2"><AlertTriangle size={16} />{message}</div>{onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>Retry</Button>}</div>
}

export function Pill({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'green' | 'blue' | 'amber' | 'red' }) {
  const tones = { slate: 'bg-slate-100 text-slate-600', green: 'bg-emerald-50 text-emerald-700', blue: 'bg-sky-50 text-sky-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700' }
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>
}
