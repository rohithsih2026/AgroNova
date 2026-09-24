import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CloudRain, Droplets, Gauge, Play, RefreshCw, Sparkles, Thermometer, Volume2, Wind, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ForecastChart } from '../components/charts'
import { MapView } from '../components/MapView'
import { Button, Card, CardHeader, ConfidenceMeter, DataLabel, MetricCard, Pill, RiskBadge, WhyPanel } from '../components/ui'
import { api } from '../services/api'
import type { AlertItem, ForecastResponse, LocationContext, Panchayat, User } from '../types'

export function DashboardPage({ context, user, onContextChange }: { context: LocationContext; user: User; onContextChange: (value: Partial<LocationContext>) => void }) {
  const navigate = useNavigate()
  const [panchayats, setPanchayats] = useState<Panchayat[]>([])
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [lastRun, setLastRun] = useState<string | null>(null)
  const selected = panchayats.find((item) => item.id === context.panchayat_id) || panchayats[0]

  const load = async () => {
    setLoading(true)
    const [items, weather, alertItems] = await Promise.all([api.panchayats(), api.forecast(), api.alerts()])
    setPanchayats(items)
    setForecast(weather)
    setAlerts(alertItems)
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const runModel = async () => {
    setRunning(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    await api.downscale()
    setLastRun(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    setRunning(false)
    navigate('/downscaling')
  }

  const speak = () => {
    if (localStorage.getItem('agronova-voice') === 'false' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const text = 'Rainfall is expected within the next 24 hours. Irrigation can be postponed. Ensure field drainage is clear.'
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
  }

  const metrics = useMemo(() => {
    if (!selected) return []
    return [
      { label: 'Temperature', value: selected.temperature.toFixed(1), unit: '°C', detail: 'Feels warm in the afternoon', icon: <Thermometer size={18} />, tone: 'orange' as const, trend: '+0.7° ' },
      { label: 'Rainfall', value: (forecast?.forecast[0]?.panchayat_rainfall || 18.6).toFixed(1), unit: 'mm', detail: 'Next 24 hours', icon: <CloudRain size={18} />, tone: 'blue' as const, trend: '68% ' },
      { label: 'Humidity', value: selected.humidity.toFixed(0), unit: '%', detail: 'Within crop comfort range', icon: <Gauge size={18} />, tone: 'purple' as const },
      { label: 'Wind speed', value: selected.wind_speed.toFixed(0), unit: 'km/h', detail: 'Light to moderate breeze', icon: <Wind size={18} />, tone: 'green' as const },
      { label: 'Soil moisture', value: selected.soil_moisture.toFixed(0), unit: '%', detail: 'Root-zone estimate', icon: <Droplets size={18} />, tone: 'blue' as const },
      { label: 'Crop stress', value: selected.crop_stress > 65 ? 'High' : selected.crop_stress > 45 ? 'Moderate' : 'Low', unit: '', detail: `${selected.crop} · ${selected.growth_stage}`, icon: <Sparkles size={18} />, tone: selected.crop_stress > 65 ? 'red' as const : 'orange' as const },
    ]
  }, [selected, forecast])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-leaf"><span className="h-2 w-2 rounded-full bg-leaf" />Good morning, {user.name.split(' ')[0]}</div><h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Panchayat-level agricultural intelligence</h1><p className="mt-1 text-sm text-slate-500">A clear view of weather, crop stress and the next field action for {context.panchayat}.</p></div><div className="flex flex-wrap items-center gap-2"><DataLabel /><Button variant="secondary" size="sm" onClick={speak}><Volume2 size={14} />Read advisory</Button><Button size="sm" onClick={() => void runModel()} disabled={running}><Play size={14} fill="currentColor" />{running ? 'Processing…' : 'Run AI downscaling'}</Button></div></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{loading ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-slate-100" />) : metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div>
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]"><ForecastCard forecast={forecast} onOpen={() => navigate('/weather')} /><AdvisoryCard onSpeak={speak} onOpen={() => navigate('/advisory')} /></div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"><MapCard panchayats={panchayats} selected={selected} onSelect={(item) => onContextChange({ panchayat_id: item.id, panchayat: item.name })} onOpen={() => navigate('/map')} /><div className="space-y-6"><RiskCard selected={selected} /><AlertsCard alerts={alerts} onOpen={() => navigate('/alerts')} /></div></div>
      {lastRun && <div className="flex items-center gap-2 text-xs text-leaf"><RefreshCw size={13} />Last downscaling run completed at {lastRun}</div>}
    </div>
  )
}

function ForecastCard({ forecast, onOpen }: { forecast: ForecastResponse | null; onOpen: () => void }) {
  return <Card><CardHeader eyebrow="Weather intelligence" title="7-day forecast · block vs Panchayat" description="Local values are estimated by the prototype spatial model." action={<Button variant="ghost" size="sm" onClick={onOpen}>Open weather <ArrowRight size={14} /></Button>} /><div className="h-[280px] p-4">{forecast && <ForecastChart data={forecast.forecast} metric="temperature" />}</div><div className="grid grid-cols-3 divide-x border-t border-slate-100"><SmallFact label="Rain probability" value="68%" detail="Peak tomorrow" tone="text-leaf" /><SmallFact label="Pressure" value="1008 hPa" detail="Stable" /><SmallFact label="Cloud cover" value="78%" detail="Rain likely" tone="text-sky-600" /></div></Card>
}

function SmallFact({ label, value, detail, tone = '' }: { label: string; value: string; detail: string; tone?: string }) {
  return <div className="p-4"><div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 text-lg font-extrabold text-ink">{value}</div><div className={`text-[10px] ${tone || 'text-slate-400'}`}>{detail}</div></div>
}

function AdvisoryCard({ onSpeak, onOpen }: { onSpeak: () => void; onOpen: () => void }) {
  return <Card className="overflow-hidden bg-ink text-white"><div className="relative p-5"><div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-leaf/20 blur-3xl" /><div className="relative"><div className="flex items-center justify-between"><Pill tone="green">Today&apos;s advisory</Pill><button onClick={onSpeak} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"><Volume2 size={16} /></button></div><h2 className="mt-5 text-xl font-extrabold leading-7">Rainfall is expected within the next 24 hours.</h2><p className="mt-3 text-xs leading-6 text-white/60">Irrigation can be postponed. Ensure field drainage is clear and avoid fertilizer application immediately before heavy rainfall.</p><div className="mt-6 space-y-3"><AdvisoryStep number="1" text="Avoid irrigation today" /><AdvisoryStep number="2" text="Monitor field water level" /><AdvisoryStep number="3" text="Check drainage before rain" /></div><Button variant="secondary" size="sm" className="mt-7 border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={onOpen}>View full advisory <ArrowRight size={14} /></Button></div></div><div className="border-t border-white/10 px-5 py-4"><ConfidenceMeter value={86} dark /></div></Card>
}

function AdvisoryStep({ number, text }: { number: string; text: string }) {
  return <div className="flex gap-3 text-xs text-white/75"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">{number}</span>{text}</div>
}

function MapCard({ panchayats, selected, onSelect, onOpen }: { panchayats: Panchayat[]; selected?: Panchayat; onSelect: (item: Panchayat) => void; onOpen: () => void }) {
  return <Card className="overflow-hidden"><CardHeader eyebrow="Spatial overview" title="Panchayat risk map" action={<Button variant="ghost" size="sm" onClick={onOpen}>Explore map <ArrowRight size={14} /></Button>} /><div className="h-[340px]">{panchayats.length > 0 && <MapView panchayats={panchayats} selectedId={selected?.id} onSelect={onSelect} height={340} showControls={false} />}</div></Card>
}

function RiskCard({ selected }: { selected?: Panchayat }) {
  if (!selected) return <Card className="min-h-52 animate-pulse bg-slate-100" />
  return <Card><CardHeader eyebrow="Decision support" title="Risk watch" action={<RiskBadge level={selected.risk_status} />} /><div className="space-y-4 p-5"><div className="flex items-center justify-between"><div><div className="text-sm font-bold text-ink">Overall crop stress</div><div className="mt-1 text-xs text-slate-500">{selected.crop} · {selected.growth_stage}</div></div><div className="text-right"><div className={`text-2xl font-extrabold ${selected.crop_stress > 65 ? 'text-red-600' : 'text-orange-600'}`}>{selected.crop_stress.toFixed(0)}%</div><div className="text-[10px] text-slate-400">stress index</div></div></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${selected.crop_stress > 65 ? 'bg-red-500' : 'bg-orange-400'}`} style={{ width: `${selected.crop_stress}%` }} /></div><WhyPanel reasons={[`Rainfall estimate is ${selected.rainfall} mm for the selected cycle.`, `Soil moisture is ${selected.soil_moisture}%, ${selected.soil_moisture < 40 ? 'below' : 'within'} the demo comfort band.`, `Vegetation index is ${selected.ndvi.toFixed(2)}; a lower index can indicate stress.`]} /></div></Card>
}

function AlertsCard({ alerts, onOpen }: { alerts: AlertItem[]; onOpen: () => void }) {
  return <Card><CardHeader eyebrow="Alerts" title={`${alerts.filter((item) => !item.is_read).length} items need attention`} action={<Button variant="ghost" size="sm" onClick={onOpen}>View all</Button>} /><div className="divide-y divide-slate-100">{alerts.slice(0, 3).map((alert) => <button key={alert.id} onClick={onOpen} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50"><div className={`flex h-8 w-8 items-center justify-center rounded-lg ${alert.severity === 'High' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}><Zap size={15} /></div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-ink">{alert.title}</div><div className="mt-1 truncate text-[10px] text-slate-400">{alert.panchayat} · {alert.time}</div></div><RiskBadge level={alert.severity} compact /></button>)}</div></Card>
}
