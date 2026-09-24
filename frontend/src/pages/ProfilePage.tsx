import { useEffect, useState, type ReactNode } from 'react'
import { Bell, CalendarDays, CloudSun, Droplets, Edit3, MapPin, Save, Sprout, Volume2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardHeader, ConfidenceMeter, DataLabel, Pill, RiskBadge } from '../components/ui'
import { api } from '../services/api'
import type { Advisory, AlertItem, IrrigationRecommendation, LocationContext, User } from '../types'

export function ProfilePage({ user, context }: { user: User; context: LocationContext }) {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name)
  const [area, setArea] = useState('1.8')
  const [crop, setCrop] = useState('Paddy')
  const [stage, setStage] = useState('Vegetative')
  const [advisory, setAdvisory] = useState<Advisory | null>(null)
  const [irrigation, setIrrigation] = useState<IrrigationRecommendation | null>(null)
  const [alerts, setAlerts] = useState<AlertItem[]>([])

  useEffect(() => {
    void Promise.all([
      api.advisory({ panchayat_id: context.panchayat_id, crop, growth_stage: stage }),
      api.irrigation({ panchayat_id: context.panchayat_id, crop, growth_stage: stage }),
      api.alerts(),
    ]).then(([nextAdvisory, nextIrrigation, nextAlerts]) => {
      setAdvisory(nextAdvisory)
      setIrrigation(nextIrrigation)
      setAlerts(nextAlerts)
    })
  }, [context.panchayat_id, crop, stage])

  const speak = () => {
    if (!('speechSynthesis' in window) || !advisory) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(advisory.summary))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-leaf"><Sprout size={15} />Farmer workspace</div><h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">My farm today</h1><p className="mt-1 text-sm text-slate-500">A personalized view of {name.split(' ')[0]}&apos;s field decisions for {context.panchayat}.</p></div><div className="flex items-center gap-2"><DataLabel /><Button variant="secondary" size="sm" onClick={() => setEditing(!editing)}><Edit3 size={14} />{editing ? 'Cancel edit' : 'Edit profile'}</Button></div></div>
      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]"><ProfileCard name={name} area={area} crop={crop} stage={stage} editing={editing} setEditing={setEditing} setName={setName} setArea={setArea} setCrop={setCrop} setStage={setStage} context={context} /><div className="space-y-6"><FarmerAdvisory advisory={advisory} onSpeak={speak} onOpen={() => navigate('/advisory')} /><div className="grid gap-6 md:grid-cols-2"><IrrigationCard irrigation={irrigation} onOpen={() => navigate('/irrigation')} /><FarmerAlerts alerts={alerts} onOpen={() => navigate('/alerts')} /></div></div></div>
    </div>
  )
}

function ProfileCard({ name, area, crop, stage, editing, setEditing, setName, setArea, setCrop, setStage, context }: { name: string; area: string; crop: string; stage: string; editing: boolean; setEditing: (value: boolean) => void; setName: (value: string) => void; setArea: (value: string) => void; setCrop: (value: string) => void; setStage: (value: string) => void; context: LocationContext }) {
  return <Card className="overflow-hidden"><div className="h-24 bg-gradient-to-r from-forest via-[#267b5a] to-sky-600" /><div className="relative px-5 pb-5"><div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-forest text-2xl font-extrabold text-white shadow-soft">{name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div className="mt-4 flex items-center justify-between"><div><h2 className="text-lg font-extrabold text-ink">{name}</h2><div className="mt-1 flex items-center gap-1 text-xs text-slate-400"><MapPin size={12} />Kozhippara village · {context.panchayat}</div></div><Pill tone="green">Active farm</Pill></div><div className="mt-5 grid grid-cols-2 gap-2"><Info label="Farm area" value={`${area} ha`} /><Info label="Crop" value={crop} /><Info label="Variety" value="ADT 47" /><Info label="Stage" value={stage} /><Info label="Soil" value="Red loamy" /><Info label="Irrigation" value="Canal" /></div>{editing ? <div className="mt-5 space-y-3 border-t border-slate-100 pt-4"><EditField label="Name" value={name} onChange={setName} /><EditField label="Farm area (ha)" value={area} onChange={setArea} /><div className="grid grid-cols-2 gap-2"><EditField label="Crop" value={crop} onChange={setCrop} /><EditField label="Growth stage" value={stage} onChange={setStage} /></div><Button size="sm" className="w-full" onClick={() => setEditing(false)}><Save size={14} />Save profile</Button></div> : <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-[10px] text-slate-400"><CalendarDays size={13} />Sowing date · 18 Jul 2026 <span className="ml-auto text-leaf">Profile synced</span></div>}</div></Card>
}

function FarmerAdvisory({ advisory, onSpeak, onOpen }: { advisory: Advisory | null; onSpeak: () => void; onOpen: () => void }) {
  return <Card className="overflow-hidden bg-ink text-white"><div className="p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><Pill tone="green">Today&apos;s farm advisory</Pill><button onClick={onSpeak} className="rounded-lg p-2 text-white/60 hover:bg-white/10"><Volume2 size={16} /></button></div><h2 className="mt-4 text-xl font-extrabold leading-7">{advisory?.title || 'Loading today&apos;s field guidance…'}</h2><p className="mt-2 text-xs leading-6 text-white/60">{advisory?.summary}</p><div className="mt-5 grid grid-cols-3 gap-2"><DarkMetric icon={<CloudSun size={15} />} label="Weather" value="31.0°C" /><DarkMetric icon={<Droplets size={15} />} label="Soil moisture" value="51%" /><DarkMetric icon={<Sprout size={15} />} label="Crop" value="Paddy" /></div><Button variant="secondary" size="sm" className="mt-5 border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={onOpen}>Open full advisory <span>→</span></Button></div><div className="border-t border-white/10 px-5 py-4"><ConfidenceMeter value={advisory?.confidence || 86} dark /></div></Card>
}

function IrrigationCard({ irrigation, onOpen }: { irrigation: IrrigationRecommendation | null; onOpen: () => void }) {
  return <Card><CardHeader eyebrow="Water decision" title="Irrigation recommendation" action={<Droplets size={17} className="text-sky-600" />} /><div className="p-5"><div className="text-base font-extrabold text-forest">{irrigation?.recommendation || 'Loading…'}</div><div className="mt-2 text-xs leading-5 text-slate-500">{irrigation?.reason}</div><div className="mt-4 flex items-center justify-between text-[10px] text-slate-400"><span>Estimated water</span><strong className="text-ink">{irrigation?.estimated_water_requirement_mm || 0} mm</strong></div><Button variant="ghost" size="sm" className="mt-3 px-0" onClick={onOpen}>View details →</Button></div></Card>
}

function FarmerAlerts({ alerts, onOpen }: { alerts: AlertItem[]; onOpen: () => void }) {
  return <Card><CardHeader eyebrow="Attention" title="My alerts" action={<Bell size={17} className="text-orange-500" />} /><div className="space-y-2 p-5">{alerts.slice(0, 2).map((alert) => <button key={alert.id} onClick={onOpen} className="flex w-full items-start gap-2 rounded-xl bg-slate-50 p-3 text-left hover:bg-mint"><span className={`mt-1 h-2 w-2 rounded-full ${alert.severity === 'High' ? 'bg-red-500' : 'bg-amber-500'}`} /><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-ink">{alert.title}</strong><small className="mt-1 block text-[10px] text-slate-400">{alert.panchayat} · {alert.time}</small></span><RiskBadge level={alert.severity} compact /></button>)}</div></Card>
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 text-xs font-bold text-ink">{value}</div></div> }
function DarkMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/45">{icon}{label}</div><div className="mt-1 text-sm font-extrabold text-white">{value}</div></div> }
function EditField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-[10px] font-bold text-slate-500">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="field-input mt-1" /></label> }
