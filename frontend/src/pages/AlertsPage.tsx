import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Bell, Check, CheckCircle2, Clock3, Filter, MapPin, RefreshCw, Siren, Volume2 } from 'lucide-react'
import { Button, Card, CardHeader, DataLabel, EmptyState, Pill, RiskBadge } from '../components/ui'
import { api } from '../services/api'
import type { AlertItem } from '../types'

export function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState<AlertItem | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    void api.alerts().then(setAlerts).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const visible = useMemo(() => {
    if (filter === 'Unread') return alerts.filter((item) => !item.is_read)
    if (filter === 'All') return alerts
    return alerts.filter((item) => item.severity === filter)
  }, [alerts, filter])

  const markRead = async (item: AlertItem) => {
    const updated = await api.markAlertRead(item.id, true)
    setAlerts((items) => items.map((entry) => entry.id === item.id ? updated : entry))
    if (selected?.id === item.id) setSelected(updated)
  }

  const speak = (item: AlertItem) => {
    if (localStorage.getItem('agronova-voice') === 'false' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(`${item.title}. ${item.message}`))
  }

  return (
    <div className="space-y-6">
      <PageHeading onRefresh={load} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Summary label="Total alerts" value={alerts.length} tone="slate" icon={<Bell size={17} />} />
        <Summary label="Unread" value={alerts.filter((item) => !item.is_read).length} tone="red" icon={<Siren size={17} />} />
        <Summary label="High priority" value={alerts.filter((item) => item.severity === 'High').length} tone="orange" icon={<Clock3 size={17} />} />
        <Summary label="Read" value={alerts.filter((item) => item.is_read).length} tone="green" icon={<CheckCircle2 size={17} />} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader eyebrow="Alert inbox" title="Filter and triage" action={<div className="flex items-center gap-1 text-[10px] text-slate-400"><Filter size={12} />Priority view</div>} />
          <div className="flex flex-wrap gap-1 border-b border-slate-100 px-5 py-3">
            {['All', 'Unread', 'High', 'Moderate', 'Low'].map((value) => (
              <button key={value} onClick={() => setFilter(value)} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold ${filter === value ? 'bg-forest text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {value}{value === 'Unread' && alerts.filter((item) => !item.is_read).length > 0 ? ` · ${alerts.filter((item) => !item.is_read).length}` : ''}
              </button>
            ))}
          </div>
          {loading ? <div className="p-5"><div className="h-64 animate-pulse rounded-xl bg-slate-100" /></div> : visible.length === 0 ? <div className="p-5"><EmptyState title="No alerts in this view" message="Try another filter or refresh the prototype alert register." /></div> : <AlertList items={visible} selectedId={selected?.id} onSelect={setSelected} />}
        </Card>
        <Card className="h-fit">
          <CardHeader eyebrow="Alert detail" title={selected?.title || 'Select an alert'} />
          {selected ? <AlertDetail item={selected} onRead={() => void markRead(selected)} onSpeak={() => speak(selected)} /> : <div className="p-5"><EmptyState title="Choose an alert" message="Select an alert from the inbox to see its evidence and recommended field action." /></div>}
        </Card>
      </div>
      <Card className="border-blue-100 bg-blue-50/50"><div className="flex gap-3 p-4 text-xs leading-5 text-blue-800"><Volume2 size={16} className="mt-0.5 shrink-0" /><span><strong>Alert delivery prototype:</strong> browser notifications, voice playback and filters are local demo interactions. A production rollout should connect verified warning sources, escalation policies and delivery logs.</span></div></Card>
    </div>
  )
}

function PageHeading({ onRefresh }: { onRefresh: () => void }) {
  return <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-red-600"><Bell size={15} />Notification centre</div><h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Alerts & early warnings</h1><p className="mt-1 text-sm text-slate-500">Actionable signals generated from the selected Panchayat intelligence layer.</p></div><div className="flex items-center gap-2"><DataLabel /><Button variant="secondary" size="sm" onClick={onRefresh}><RefreshCw size={14} />Refresh</Button></div></div>
}

function AlertList({ items, selectedId, onSelect }: { items: AlertItem[]; selectedId?: string; onSelect: (item: AlertItem) => void }) {
  return <div className="divide-y divide-slate-100">{items.map((item) => <button key={item.id} onClick={() => onSelect(item)} className={`flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50 ${selectedId === item.id ? 'bg-mint/50' : ''}`}><div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.severity === 'High' ? 'bg-red-50 text-red-600' : item.severity === 'Moderate' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'}`}><Siren size={17} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`text-sm font-bold ${item.is_read ? 'text-slate-500' : 'text-ink'}`}>{item.title}</span>{!item.is_read && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}</div><div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400"><span className="flex items-center gap-1"><MapPin size={11} />{item.panchayat}</span><span>·</span><span>{item.time}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{item.message}</p></div><RiskBadge level={item.severity} compact /></button>)}</div>
}

function AlertDetail({ item, onRead, onSpeak }: { item: AlertItem; onRead: () => void; onSpeak: () => void }) {
  return <div className="p-5"><div className="flex items-center justify-between"><RiskBadge level={item.severity} /><Pill tone="slate">{item.type}</Pill></div><div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">{item.message}</div><div className="mt-5 space-y-3"><Detail label="Panchayat" value={item.panchayat} icon={<MapPin size={14} />} /><Detail label="Time window" value={item.time} icon={<Clock3 size={14} />} /><Detail label="Recommended action" value={item.recommended_action} icon={<CheckCircle2 size={14} />} /></div><div className="mt-6 flex flex-wrap gap-2"><Button size="sm" onClick={onRead} disabled={item.is_read}><Check size={14} />{item.is_read ? 'Marked as read' : 'Mark as read'}</Button><Button size="sm" variant="secondary" onClick={onSpeak}><Volume2 size={14} />Speak</Button></div></div>
}

function Summary({ label, value, tone, icon }: { label: string; value: number; tone: string; icon: ReactNode }) {
  const colors: Record<string, string> = { slate: 'bg-slate-100 text-slate-600', red: 'bg-red-50 text-red-600', orange: 'bg-orange-50 text-orange-600', green: 'bg-emerald-50 text-emerald-600' }
  return <Card className="flex items-center gap-3 p-4"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors[tone]}`}>{icon}</span><div><div className="text-xl font-extrabold text-ink">{value}</div><div className="text-[10px] font-semibold text-slate-400">{label}</div></div></Card>
}

function Detail({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="flex gap-3"><span className="mt-0.5 text-leaf">{icon}</span><div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 text-xs font-semibold leading-5 text-slate-600">{value}</div></div></div>
}
