import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AdminPage } from './pages/AdminPage'
import { AdvisoryPage } from './pages/AdvisoryPage'
import { AlertsPage } from './pages/AlertsPage'
import { DashboardPage } from './pages/DashboardPage'
import { DownscalePage } from './pages/DownscalePage'
import { HistoryPage } from './pages/HistoryPage'
import { IrrigationPage } from './pages/IrrigationPage'
import { LoginPage } from './pages/LoginPage'
import { MapPage } from './pages/MapPage'
import { ModelPerformancePage } from './pages/ModelPerformancePage'
import { OfficerPage } from './pages/OfficerPage'
import { ProfilePage } from './pages/ProfilePage'
import { RiskPage } from './pages/RiskPage'
import { SatellitePage } from './pages/SatellitePage'
import { SettingsPage } from './pages/SettingsPage'
import { SimulationPage } from './pages/SimulationPage'
import { WeatherPage } from './pages/WeatherPage'
import { api } from './services/api'
import type { LocationContext, User } from './types'

const defaultContext: LocationContext = { state: 'Tamil Nadu', district: 'Madurai', block: 'Demo Block', panchayat: 'Demo Panchayat', state_code: 'TN', district_id: 'tn-madurai', block_id: 'demo-block', panchayat_id: 'p-01' }

function getStoredUser(): User | null { try { const value = localStorage.getItem('agronova-user'); return value ? JSON.parse(value) as User : null } catch { return null } }

export default function App() {
  const [user, setUser] = useState<User | null>(getStoredUser)
  const [context, setContext] = useState<LocationContext>(defaultContext)
  useEffect(() => { void api.context().then((value) => setContext((current) => ({ ...current, ...value }))) }, [])
  const login = (nextUser: User) => { setUser(nextUser); localStorage.setItem('agronova-user', JSON.stringify(nextUser)) }
  const logout = () => { setUser(null); localStorage.removeItem('agronova-user') }
  const changeContext = (value: Partial<LocationContext>) => setContext((current) => ({ ...current, ...value }))
  if (!user) return <LoginPage onLogin={login} />
  return <BrowserRouter><AppShell user={user} context={context} onContextChange={changeContext} onLogout={logout}><Routes><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="/dashboard" element={<DashboardPage user={user} context={context} onContextChange={changeContext} />} /><Route path="/map" element={<MapPage context={context} onContextChange={changeContext} />} /><Route path="/weather" element={<WeatherPage context={context} />} /><Route path="/downscaling" element={<DownscalePage context={context} />} /><Route path="/model-performance" element={<ModelPerformancePage />} /><Route path="/advisory" element={<AdvisoryPage context={context} onContextChange={changeContext} />} /><Route path="/irrigation" element={<IrrigationPage context={context} />} /><Route path="/risk" element={<RiskPage context={context} />} /><Route path="/satellite" element={<SatellitePage context={context} />} /><Route path="/alerts" element={<AlertsPage />} /><Route path="/history" element={<HistoryPage context={context} />} /><Route path="/simulation" element={<SimulationPage context={context} />} /><Route path="/profile" element={<ProfilePage user={user} context={context} />} /><Route path="/officer" element={<OfficerPage context={context} />} /><Route path="/admin" element={<AdminPage />} /><Route path="/settings" element={<SettingsPage />} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes></AppShell></BrowserRouter>
}
