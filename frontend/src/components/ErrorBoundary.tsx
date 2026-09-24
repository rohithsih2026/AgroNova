import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State { return { hasError: true, message: error.message } }

  componentDidCatch(error: Error, info: ErrorInfo) { console.error('AgroNova UI error', error, info) }

  render() {
    if (!this.state.hasError) return this.props.children
    return <div className="flex min-h-screen items-center justify-center bg-[#f7faf8] p-6"><div className="max-w-md rounded-2xl border border-red-100 bg-white p-7 text-center shadow-soft"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600"><AlertTriangle size={23} /></div><h1 className="mt-4 text-lg font-extrabold text-ink">AgroNova needs a refresh</h1><p className="mt-2 text-xs leading-5 text-slate-500">A view could not be rendered. The demo data is still available after resetting the workspace.</p><button onClick={() => window.location.reload()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-xs font-bold text-white"><RefreshCw size={14} />Reload workspace</button></div></div>
  }
}
