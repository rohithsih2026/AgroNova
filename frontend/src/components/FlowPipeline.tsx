import { ArrowDown, BrainCircuit, Database, MapPinned, Radio, Sparkles, Sprout } from 'lucide-react'

const steps = [
  { label: 'Block weather', sub: 'Coarse observations', icon: Radio, tone: 'bg-sky-50 text-sky-600' },
  { label: 'Data fusion', sub: 'Weather + terrain', icon: Database, tone: 'bg-violet-50 text-violet-600' },
  { label: 'Spatial features', sub: '16 model inputs', icon: MapPinned, tone: 'bg-amber-50 text-amber-600' },
  { label: 'ML model', sub: 'Random Forest', icon: BrainCircuit, tone: 'bg-forest text-white' },
  { label: 'Panchayat weather', sub: 'Local estimate', icon: Sparkles, tone: 'bg-emerald-50 text-emerald-600' },
  { label: 'Crop / risk engine', sub: 'Decision support', icon: Sprout, tone: 'bg-orange-50 text-orange-600' },
]

export function FlowPipeline({ active = 4, compact = false }: { active?: number; compact?: boolean }) {
  return <div className={`flex items-stretch ${compact ? 'gap-1 overflow-x-auto pb-2' : 'flex-col gap-0 sm:flex-row sm:items-center'}`}>{steps.map((step, index) => { const Icon = step.icon; const complete = index < active; const current = index === active; return <div key={step.label} className={`flex min-w-0 ${compact ? 'flex-1 min-w-[120px]' : 'flex-1 flex-col sm:flex-row'}`}><div className={`relative flex ${compact ? 'flex-col items-center text-center' : 'items-center gap-3 sm:flex-col lg:flex-row lg:text-left'} ${index < steps.length - 1 ? 'after:absolute after:z-10 after:flex after:items-center after:justify-center after:text-forest' : ''}`} style={compact ? undefined : {}}><div className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${current ? 'ring-4 ring-forest/10' : ''} ${complete ? 'bg-forest text-white' : current ? step.tone : 'bg-slate-100 text-slate-400'}`}><Icon size={19} /></div><div className={compact ? 'mt-2' : ''}><div className={`text-[11px] font-extrabold ${current || complete ? 'text-ink' : 'text-slate-400'}`}>{step.label}</div><div className="mt-0.5 text-[9px] text-slate-400">{step.sub}</div></div>{index < steps.length - 1 && <div className={`absolute ${compact ? 'left-[calc(50%+24px)] right-[-10px] top-5 h-px' : 'bottom-[-15px] left-1/2 top-[46px] h-6 w-px sm:left-auto sm:right-[-10px] sm:top-1/2 sm:h-px sm:w-6'} flow-connector bg-gradient-to-r from-forest/50 to-sky-300`}><ArrowDown className="absolute -bottom-1 -left-1 rotate-90 text-forest/60 sm:hidden" size={12} /></div>}</div></div>})}</div>
}
