import { useEffect } from 'react'
import { Layers, MapPin, Satellite, ZoomIn } from 'lucide-react'
import { MapContainer, Polygon, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import type { Panchayat } from '../types'

const riskColors: Record<string, { fill: string; stroke: string }> = { Normal: { fill: '#34a66b', stroke: '#167347' }, Moderate: { fill: '#eabf45', stroke: '#b68a0b' }, High: { fill: '#f28b3c', stroke: '#c26114' }, Critical: { fill: '#df5353', stroke: '#ae3030' } }

function FitBounds({ panchayats }: { panchayats: Panchayat[] }) {
  const map = useMap()
  useEffect(() => { if (panchayats.length) { const bounds = panchayats.flatMap((item) => item.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number])) as LatLngBoundsExpression; map.fitBounds(bounds, { padding: [28, 28] }) } }, [map, panchayats])
  return null
}

export function MapView({ panchayats, selectedId, onSelect, height = 520, layer = 'risk', showControls = true }: { panchayats: Panchayat[]; selectedId?: string; onSelect?: (item: Panchayat) => void; height?: number; layer?: 'risk' | 'rainfall' | 'temperature' | 'ndvi'; showControls?: boolean }) {
  const colorFor = (item: Panchayat) => {
    if (layer === 'rainfall') return item.rainfall > 40 ? '#df5353' : item.rainfall > 25 ? '#f28b3c' : '#4b9cdb'
    if (layer === 'temperature') return item.temperature >= 32 ? '#df5353' : item.temperature >= 30 ? '#f28b3c' : '#4b9cdb'
    if (layer === 'ndvi') return item.ndvi >= 0.67 ? '#34a66b' : item.ndvi >= 0.56 ? '#eabf45' : '#df5353'
    const colors = riskColors[item.risk_status] || riskColors.Normal
    return colors.fill
  }
  return <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100" style={{ height }}><MapContainer center={[9.925, 78.119]} zoom={11} scrollWheelZoom className="h-full w-full"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><FitBounds panchayats={panchayats} />{panchayats.map((item) => { const fill = colorFor(item); const selected = selectedId === item.id; return <Polygon key={item.id} positions={item.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number])} pathOptions={{ color: selected ? '#17231d' : riskColors[item.risk_status]?.stroke || '#167347', weight: selected ? 3 : 1.5, fillColor: fill, fillOpacity: selected ? 0.82 : 0.58 }} eventHandlers={{ click: () => onSelect?.(item) }}><Tooltip direction="top" offset={[0, -8]}><div className="text-xs font-bold">{item.name}</div><div className="mt-1 text-[10px]">{item.risk_status} · {item.rainfall} mm · {item.temperature}°C</div></Tooltip><Popup><div className="min-w-44"><div className="font-bold">{item.name}</div><div className="mt-2 grid grid-cols-2 gap-1 text-[11px]"><span>Temperature</span><strong>{item.temperature}°C</strong><span>Rainfall</span><strong>{item.rainfall} mm</strong><span>Soil moisture</span><strong>{item.soil_moisture}%</strong><span>Risk</span><strong>{item.risk_status}</strong></div></div></Popup></Polygon> })}</MapContainer>{showControls && <><div className="pointer-events-none absolute left-3 top-3 z-[400] flex items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-[10px] font-bold text-slate-600 shadow-soft backdrop-blur"><Layers size={13} className="text-leaf" />{layer === 'risk' ? 'Risk status' : layer === 'rainfall' ? 'Rainfall (mm)' : layer === 'temperature' ? 'Temperature (°C)' : 'NDVI'}</div><div className="absolute bottom-3 left-3 z-[400] rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-[9px] text-slate-500 shadow-soft backdrop-blur"><div className="mb-1 font-bold text-slate-600">Prototype boundary layer</div><div className="flex items-center gap-3"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" />Normal</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-amber-400" />Moderate</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-orange-400" />High</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-red-500" />Critical</span></div></div><div className="absolute right-3 top-3 z-[400] flex flex-col gap-1 rounded-xl border border-white/70 bg-white/90 p-1 shadow-soft backdrop-blur"><button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50" title="Zoom"><ZoomIn size={15} /></button><button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50" title="Satellite preview"><Satellite size={15} /></button></div></>}</div>
}
