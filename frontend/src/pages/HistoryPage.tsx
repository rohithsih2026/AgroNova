import { useEffect, useState, type ReactNode } from 'react'
import { BarChart3, CalendarRange, Download, History, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { TrendChart } from '../components/charts'
import { Button, Card, CardHeader, DataLabel, LoadingBlock, MetricCard, Pill } from '../components/ui'
import { api } from '../services/api'
import type { HistoryResponse, LocationContext } from '../types'

const variables = [
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', color: '#3b82c4' },
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#e07b39' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#7c66bd' },
  { key: 'soil_moisture', label: 'Soil moisture', unit: '%', color: '#2f8f63' },
  { key: 'ndvi', label: 'NDVI', unit: '', color: '#16a34a' },
]

export function HistoryPage({ context }: { context: LocationContext }) {
  const [variable, setVariable] = useState('rainfall')
  const [days, setDays] = useState(30)
  const [data, setData] = useState<HistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const config = variables.find((item) => item.key === variable) || variables[0]

  useEffect(() => {
    setLoading(true)
    void api.history(context.panchayat_id, variable, days).then(setData).finally(() => setLoading(false))
  }, [context.panchayat_id, variable, days])

  const trendIcon = data?.summary.trend === 'rising' ? <TrendingUp size={16} /> : <TrendingDown size={16} />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500"><History size={15} />Time-series intelligence</div><h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Historical analysis</h1><p className="mt-1 text-sm text-slate-500">Explore the recent signal behind today&apos;s field decisions.</p></div><div className="flex items-center gap-2"><DataLabel /><Button variant="secondary" size="sm" onClick={() => window.print()}><Download size={14} />Export view</Button></div></div>
      <Card><CardHeader eyebrow="Analysis controls" title="Choose a variable and range" /><div className="flex flex-wrap items-end gap-4 p-5"><label className="text-[11px] font-bold text-slate-500">Variable<select value={variable} onChange={(event) => setVariable(event.target.value)} className="field-input mt-1.5 w-48">{variables.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label><label className="text-[11px] font-bold text-slate-500">Date range<select value={days} onChange={(event) => setDays(Number(event.target.value))} className="field-input mt-1.5 w-40"><option value={14}>Last 14 days</option><option value={30}>Last 30 days</option><option value={60}>Last 60 days</option><option value={90}>Last 90 days</option></select></label><div className="ml-auto flex items-center gap-2 text-xs text-slate-500"><CalendarRange size={15} className="text-leaf" />{data?.rows[0]?.date || '—'} → {data?.rows[data.rows.length - 1]?.date || '—'}</div></div></Card>
      {loading || !data ? <LoadingBlock label="Loading historical signal" /> : <HistoryResults data={data} config={config} trendIcon={trendIcon} />}
    </div>
  )
}

function HistoryResults({ data, config, trendIcon }: { data: HistoryResponse; config: (typeof variables)[number]; trendIcon: ReactNode }) {
  const latest = Number(data.rows[data.rows.length - 1][data.variable])
  return <>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5"><MetricCard label="Average" value={data.summary.average} unit={config.unit} detail="Selected range" icon={<BarChart3 size={17} />} tone="blue" /><MetricCard label="Maximum" value={data.summary.maximum} unit={config.unit} detail="Peak observed" icon={<TrendingUp size={17} />} tone="green" /><MetricCard label="Minimum" value={data.summary.minimum} unit={config.unit} detail="Lowest observed" icon={<TrendingDown size={17} />} tone="orange" /><MetricCard label="Anomaly" value={`${data.summary.anomaly > 0 ? '+' : ''}${data.summary.anomaly}`} unit={config.unit} detail="Latest vs average" icon={<History size={17} />} tone={data.summary.anomaly > 0 ? 'orange' : 'blue'} /><Card className="p-4"><div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Trend</div><div className="mt-3 flex items-center gap-2 text-xl font-extrabold capitalize text-forest">{trendIcon}{data.summary.trend}</div><div className="mt-2 text-[10px] text-slate-400">Prototype time series</div></Card></div>
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"><Card><CardHeader eyebrow="Interactive chart" title={`${config.label} trend`} description="Hover over points to inspect the date and value." action={<Pill tone="blue">{data.rows.length} observations</Pill>} /><div className="h-[360px] p-4"><TrendChart data={data.rows} dataKey={data.variable} color={config.color} unit={config.unit} name={config.label} reference={data.summary.average} /></div></Card><Card><CardHeader eyebrow="Interpretation" title="What the history says" /><div className="space-y-4 p-5"><div className="rounded-xl bg-slate-50 p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Latest observation</div><div className="mt-2 text-2xl font-extrabold text-ink">{latest.toFixed(1)} <span className="text-xs font-medium text-slate-400">{config.unit}</span></div><div className="mt-1 text-xs text-slate-500">{data.summary.anomaly > 0 ? 'Above' : 'Below'} the selected-range average</div></div><div className="space-y-3 text-xs leading-5 text-slate-600"><p>Average <strong className="text-ink">{data.summary.average} {config.unit}</strong>; the latest value is <strong className="text-ink">{latest.toFixed(1)} {config.unit}</strong>.</p><p>Observed range: <strong className="text-ink">{data.summary.minimum}–{data.summary.maximum} {config.unit}</strong>.</p></div><Button variant="secondary" size="sm" className="w-full" onClick={() => window.print()}>Download analysis view</Button></div></Card></div>
    <Card className="border-slate-200 bg-slate-50/60"><div className="flex items-start gap-3 p-4 text-xs leading-5 text-slate-500"><History size={15} className="mt-0.5 shrink-0 text-slate-400" /><span><strong className="text-slate-700">Data lineage:</strong> synthetic demonstration observations are generated locally for repeatable evaluation. Replace `history` with an approved weather/soil/satellite time-series repository for production analysis.</span></div></Card>
  </>
}
