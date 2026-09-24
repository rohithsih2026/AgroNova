import { useEffect, useState } from 'react'
import { Activity, BarChart3, Droplets, Leaf, RefreshCw, Satellite, Thermometer, Waves } from 'lucide-react'
import { MapView } from '../components/MapView'
import { TrendChart } from '../components/charts'
import { Button, Card, CardHeader, ConfidenceMeter, DataLabel, MetricCard, Pill, WhyPanel } from '../components/ui'
import { api } from '../services/api'
import type { LocationContext, Panchayat, SatelliteResponse } from '../types'

export function SatellitePage({ context }: { context: LocationContext }) {
  const [data, setData] = useState<SatelliteResponse | null>(null)
  const [panchayats, setPanchayats] = useState<Panchayat[]>([])
  const refresh = () => { void api.satellite(context.panchayat_id).then(setData) }

  useEffect(() => {
    void api.satellite(context.panchayat_id).then(setData)
    void api.panchayats().then(setPanchayats)
  }, [context.panchayat_id])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-teal-600"><Satellite size={15} />Earth observation</div><h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Satellite insights</h1><p className="mt-1 text-sm text-slate-500">Vegetation and surface-water indicators for a faster view of crop condition.</p></div><div className="flex items-center gap-2"><DataLabel /><Button variant="secondary" size="sm" onClick={refresh}><RefreshCw size={14} />Refresh</Button></div></div>
      {data ? <SatelliteResults data={data} panchayats={panchayats} selectedId={context.panchayat_id} /> : <Card><div className="flex min-h-80 items-center justify-center text-sm text-slate-500">Loading satellite indicators…</div></Card>}
    </div>
  )
}

function SatelliteResults({ data, panchayats, selectedId }: { data: SatelliteResponse; panchayats: Panchayat[]; selectedId: string }) {
  const timeSeries = Array.from({ length: 30 }, (_, index) => ({ date: new Date(Date.now() - (29 - index) * 86400000).toISOString().slice(0, 10), ndvi: Math.round((data.ndvi + Math.sin(index / 5) * 0.05) * 100) / 100 }))
  return <>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><MetricCard label="Current NDVI" value={data.ndvi} detail="Vegetation vigor" icon={<Leaf size={18} />} tone="green" /><MetricCard label="Previous NDVI" value={data.previous_ndvi} detail="Prior observation" icon={<Activity size={18} />} tone="blue" /><MetricCard label="Change" value={`${data.change_percent > 0 ? '+' : ''}${data.change_percent}%`} detail="Since previous" icon={<BarChart3 size={18} />} tone={data.change_percent < -3 ? 'red' : 'green'} /><MetricCard label="Surface temp" value={data.land_surface_temperature} unit="°C" detail="Land surface" icon={<Thermometer size={18} />} tone="orange" /></div>
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"><Card className="overflow-hidden"><CardHeader eyebrow="Vegetation map" title="NDVI layer · demo boundary" action={<Pill tone="green">Synthetic indicator</Pill>} /><div className="h-[470px]">{panchayats.length > 0 && <MapView panchayats={panchayats} selectedId={selectedId} layer="ndvi" height={470} />}</div></Card><div className="space-y-6"><Card><CardHeader eyebrow="Vegetation signal" title={data.panchayat} /><div className="p-5"><div className={`rounded-xl p-4 ${data.change_percent < -3 ? 'bg-amber-50' : 'bg-emerald-50'}`}><div className="text-lg font-extrabold text-ink">{data.status}</div><div className="mt-1 text-xs leading-5 text-slate-600">NDVI changed by <strong>{data.change_percent > 0 ? '+' : ''}{data.change_percent}%</strong> compared with the previous demonstration observation.</div></div><div className="mt-5 space-y-3"><IndexRow label="NDVI" value={data.ndvi} max={1} color="bg-emerald-500" /><IndexRow label="NDWI" value={data.ndwi} max={1} color="bg-sky-500" /><IndexRow label="Surface temperature" value={data.land_surface_temperature} max={50} color="bg-orange-500" /></div><div className="mt-5"><ConfidenceMeter value={86} label="Prototype indicator confidence" /></div></div></Card><Card><CardHeader eyebrow="Interpretation" title="How to use this signal" /><div className="p-5"><WhyPanel title="Why is vegetation changing?" reasons={['NDVI is a spectral vegetation proxy; it does not identify a specific disease.', 'NDWI helps describe surface-water context and should be interpreted with rainfall and terrain.', 'Land surface temperature can differ from air temperature and is a screening indicator.']} /><div className="mt-4 flex gap-2 text-[10px] leading-5 text-slate-400"><Waves size={14} className="mt-0.5 shrink-0" />Source: synthetic satellite indicator demo. Replace with validated ISRO/Sentinel products for operational use.</div></div></Card></div></div>
    <Card><CardHeader eyebrow="NDVI time series" title="Vegetation trend · 30 days" /><div className="h-[250px] p-4"><TrendChart data={timeSeries} dataKey="ndvi" color="#2f8f63" name="NDVI" /></div></Card>
  </>
}

function IndexRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return <div><div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-semibold text-slate-600">{label}</span><strong className="text-ink">{value.toFixed(2)}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value / max * 100)}%` }} /></div></div>
}
