import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, Bug, CheckCircle2, CloudRain, Droplets, Flame, Gauge, Info, RefreshCw, Wind } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button, Card, CardHeader, ConfidenceMeter, DataLabel, Pill, RiskBadge, WhyPanel } from '../components/ui'
import { api } from '../services/api'
import type { LocationContext, RiskItem, RiskResponse } from '../types'

export function RiskPage({ context }: { context: LocationContext }) {
  const [risk, setRisk] = useState<RiskResponse | null>(null)
  const [filter, setFilter] = useState('All')

  useEffect(() => { void api.risk(context.panchayat_id).then(setRisk) }, [context.panchayat_id])

  const filtered = risk?.risks.filter((item) => filter === 'All' || item.level === filter) || []
  const refresh = () => { void api.risk(context.panchayat_id).then(setRisk) }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-orange-600"><AlertTriangle size={15} />Decision risk</div><h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Weather-based crop risk</h1><p className="mt-1 text-sm text-slate-500">Multi-hazard signals translated into clear, actionable field responses.</p></div><div className="flex items-center gap-2"><DataLabel /><Button variant="secondary" size="sm" onClick={refresh}><RefreshCw size={14} />Refresh</Button></div></div>
      {risk ? <RiskResults risk={risk} filtered={filtered} filter={filter} setFilter={setFilter} /> : <Card><div className="flex min-h-80 items-center justify-center text-sm text-slate-500">Loading risk signals…</div></Card>}
    </div>
  )
}

function RiskResults({ risk, filtered, filter, setFilter }: { risk: RiskResponse; filtered: RiskItem[]; filter: string; setFilter: (value: string) => void }) {
  const sortedRisks = [...risk.risks].sort((a, b) => b.probability - a.probability)
  return <>
    <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]"><RiskSummary risk={risk} /><Card><CardHeader eyebrow="Hazard register" title="Signals to watch" action={<div className="flex gap-1 rounded-xl bg-slate-100 p-1">{['All', 'High', 'Moderate', 'Low'].map((value) => <button key={value} onClick={() => setFilter(value)} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${filter === value ? 'bg-white text-forest shadow-sm' : 'text-slate-500'}`}>{value}</button>)}</div>} /><div className="divide-y divide-slate-100">{filtered.map((item) => <RiskRow key={item.type} item={item} />)}</div></Card></div>
    <div className="grid gap-6 lg:grid-cols-3"><RiskExplainer icon={<CloudRain size={18} />} title="Heavy rain & flood" text="Rainfall threshold, moisture and distance to water are fused into a drainage-first response." tone="blue" /><RiskExplainer icon={<Droplets size={18} />} title="Drought & water stress" text="Root-zone moisture and forecast rainfall deficit flag when irrigation supply needs review." tone="amber" /><RiskExplainer icon={<Flame size={18} />} title="Heat stress" text="Temperature, humidity and evapotranspiration drive early-morning irrigation guidance." tone="red" /><RiskExplainer icon={<Bug size={18} />} title="Weather-favoured disease pressure" text="Humidity and rainfall are risk signals only. They are not a definitive disease diagnosis." tone="purple" /><RiskExplainer icon={<Wind size={18} />} title="Wind damage" text="Wind speed is compared with a demo field threshold for staking and equipment actions." tone="teal" /><RiskExplainer icon={<Gauge size={18} />} title="Confidence & traceability" text="Every output retains the input features, reasons and prototype confidence score." tone="green" /></div>
    <Card><CardHeader eyebrow="Explainable AI" title="Why is this risk elevated?" /><div className="grid gap-5 p-5 lg:grid-cols-2"><WhyPanel title="Evidence used" reasons={sortedRisks.slice(0, 3).flatMap((item) => item.reasons)} /><div className="rounded-xl border border-slate-100 p-4"><div className="text-xs font-bold text-ink">Recommended field response</div><div className="mt-3 space-y-3">{risk.risks.filter((item) => item.level !== 'Low').slice(0, 3).map((item) => <div key={item.type} className="flex gap-2 text-xs leading-5 text-slate-600"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-leaf" /><span><strong className="text-ink">{item.type}:</strong> {item.action}</span></div>)}</div></div></div></Card>
    <Card><CardHeader eyebrow="Risk trend" title="Signal probability by hazard" description="A comparative view of the current demo risk register." /><div className="h-[260px] p-4"><RiskBarChart items={risk.risks} /></div></Card>
  </>
}

function RiskSummary({ risk }: { risk: RiskResponse }) {
  const high = risk.overall_risk === 'High' || risk.overall_risk === 'Critical'
  return <Card className="overflow-hidden"><div className={`p-6 ${high ? 'bg-red-50' : risk.overall_risk === 'Moderate' ? 'bg-amber-50' : 'bg-emerald-50'}`}><div className="flex items-center justify-between"><Pill tone={high ? 'red' : risk.overall_risk === 'Moderate' ? 'amber' : 'green'}>{risk.panchayat}</Pill><RiskBadge level={risk.overall_risk} /></div><div className="mt-6 flex items-end justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Overall risk score</div><div className="mt-2 text-5xl font-extrabold tracking-tight text-ink">{risk.risk_score}<span className="text-2xl text-slate-400">%</span></div></div><div className="flex h-24 w-24 items-center justify-center rounded-full border-[10px] border-white/70 text-center shadow-sm" style={{ borderTopColor: risk.risk_score > 65 ? '#dc4c4c' : '#f59e0b' }}><div><div className="text-xl font-extrabold text-ink">{risk.overall_risk}</div><div className="text-[9px] text-slate-400">priority</div></div></div></div><div className="mt-6"><ConfidenceMeter value={risk.confidence} /></div><div className="mt-5 flex gap-2 rounded-xl bg-white/60 p-3 text-[10px] leading-5 text-slate-600"><Info size={14} className="mt-0.5 shrink-0 text-slate-400" />{risk.disclaimer}</div></div></Card>
}

function RiskBarChart({ items }: { items: RiskItem[] }) {
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={items} layout="vertical" margin={{ top: 4, right: 12, left: 18, bottom: 0 }}><CartesianGrid stroke="#edf2ef" horizontal={false} /><XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="type" width={100} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [`${Number(value)}%`, 'Probability']} /><Bar dataKey="probability" fill="#e07b39" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>
}

function RiskRow({ item }: { item: RiskItem }) {
  const Icon = item.type.includes('Rain') || item.type.includes('Flood') ? CloudRain : item.type.includes('Drought') || item.type.includes('Water') ? Droplets : item.type.includes('Heat') ? Flame : item.type.includes('Humidity') ? Bug : Wind
  return <div className="flex items-start gap-3 px-5 py-4"><div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.level === 'High' || item.level === 'Critical' ? 'bg-red-50 text-red-600' : item.level === 'Moderate' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}><Icon size={17} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-ink">{item.type}</span><RiskBadge level={item.level} compact /></div><div className="mt-1 text-[10px] text-slate-400">{item.reasons.join(' · ')}</div><div className="mt-2 text-[11px] leading-5 text-slate-600"><strong className="text-ink">Action:</strong> {item.action}</div></div><div className="text-right"><div className="text-sm font-extrabold text-ink">{item.probability}%</div><div className="text-[9px] text-slate-400">probability</div></div></div>
}

function RiskExplainer({ icon, title, text, tone }: { icon: ReactNode; title: string; text: string; tone: string }) {
  const toneClass = tone === 'blue' ? 'bg-sky-50 text-sky-600' : tone === 'amber' ? 'bg-amber-50 text-amber-600' : tone === 'red' ? 'bg-red-50 text-red-600' : tone === 'purple' ? 'bg-violet-50 text-violet-600' : tone === 'teal' ? 'bg-teal-50 text-teal-600' : 'bg-emerald-50 text-emerald-600'
  return <Card className="p-4"><div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${toneClass}`}>{icon}</div><div className="text-xs font-bold text-ink">{title}</div><div className="mt-1.5 text-[11px] leading-5 text-slate-500">{text}</div></Card>
}
