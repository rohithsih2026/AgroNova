import { localAlerts, localCrops, localForecast, localHistory, localPanchayats, localUser } from '../data/demoData'
import type { Advisory, AlertItem, CurrentWeather, DownscaleResult, ForecastResponse, HistoryResponse, IrrigationRecommendation, ModelMetrics, OfficerRow, Panchayat, RiskItem, RiskResponse, SatelliteResponse, SimulationResponse, User } from '../types'

const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
let forcedDemo = import.meta.env.VITE_DEMO_MODE === 'true'
let lastRequestWasFallback = false

export const apiState = {
  get forcedDemo() { return forcedDemo },
  get lastRequestWasFallback() { return lastRequestWasFallback },
  setDemoMode(value: boolean) { forcedDemo = value },
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (forcedDemo) throw new Error('Demo mode uses the local synthetic provider')
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!response.ok) throw new Error(`API ${response.status}`)
  return response.json() as Promise<T>
}

function json(method: string, body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) }
}

function panchayatOrFirst(id: string): Panchayat {
  return localPanchayats.find((item) => item.id === id) || localPanchayats[0]
}

function localDownscale(model: 'random_forest' | 'xgboost' | 'baseline' = 'random_forest'): DownscaleResult[] {
  return localPanchayats.map((item) => {
    const baseline = { temperature: item.temperature, rainfall: Math.round(item.rainfall * 0.96 * 10) / 10, humidity: item.humidity, wind: item.wind_speed, soil_moisture: item.soil_moisture }
    const temperature = model === 'baseline' ? baseline.temperature : Math.round((item.temperature + 0.2 + item.elevation / 2000) * 10) / 10
    const rainfall = model === 'baseline' ? baseline.rainfall : Math.round((item.rainfall * 0.94 + item.distance_to_water * 0.8) * 10) / 10
    const humidity = model === 'baseline' ? baseline.humidity : Math.round(Math.min(98, item.humidity + item.distance_to_water * 0.8) * 10) / 10
    const wind = model === 'baseline' ? baseline.wind : Math.round((item.wind_speed + item.elevation / 180) * 10) / 10
    const soilMoisture = model === 'baseline' ? baseline.soil_moisture : Math.round(Math.min(92, Math.max(20, item.soil_moisture + rainfall * 0.08)) * 10) / 10
    return { panchayat_id: item.id, panchayat: item.name, temperature, rainfall, humidity, wind, soil_moisture: soilMoisture, confidence: item.confidence, baseline, explanation: model === 'baseline' ? ['Inverse-distance interpolation is the transparent spatial baseline.', 'No learned environmental adjustment is applied in baseline mode.'] : [`Elevation (${item.elevation} m) adjusts the block signal.`, `Vegetation index (${item.vegetation_index.toFixed(2)}) and water distance (${item.distance_to_water} km) inform local moisture.`, 'Historical weather and block observations are fused as model features.'], model_version: model === 'baseline' ? 'prototype-idw-v1' : model === 'xgboost' ? 'prototype-heuristic-fallback-v1' : 'prototype-rf-v1', model_used: model === 'baseline' ? 'idw' : model === 'xgboost' ? 'heuristic' : 'local_demo', generated_at: new Date().toISOString() }
  })
}

function localMetrics(): ModelMetrics {
  return { dataset_label: 'Prototype Demonstration Dataset', model: 'Random Forest spatial downscaler', model_version: 'prototype-rf-v1', metrics: [{ variable: 'Temperature', mae: 0.42, rmse: 0.61, r2: 0.91, unit: '°C' }, { variable: 'Rainfall', mae: 2.1, rmse: 2.8, r2: 0.78, unit: 'mm' }, { variable: 'Humidity', mae: 1.8, rmse: 2.4, r2: 0.84, unit: '%' }], chart: Array.from({ length: 14 }, (_, index) => ({ point: index + 1, actual: Math.round((30 + Math.sin(index / 2) * 1.4) * 100) / 100, predicted: Math.round((30.1 + Math.sin(index / 2) * 1.35) * 100) / 100, variable: 'Temperature' })), confidence: 86, confidence_label: 'High', note: 'Metrics are calculated on held-out synthetic demonstration rows and are not real-world validation.', importance: [{ feature: 'block_temperature', importance: 0.28 }, { feature: 'elevation', importance: 0.17 }, { feature: 'vegetation_index', importance: 0.13 }, { feature: 'distance_to_water', importance: 0.09 }, { feature: 'historical_temperature', importance: 0.08 }] }
}

function localAdvisory(payload: Record<string, unknown>): Advisory {
  const panchayat = panchayatOrFirst(String(payload.panchayat_id || 'p-01'))
  const language = payload.language === 'ta' ? 'ta' : 'en'
  const farmArea = Number(payload.farm_area || 1)
  const rain = localForecast.forecast[1].panchayat_rainfall
  const actions = rain >= 15 ? [{ priority: 'high', title: 'Avoid irrigation today', detail: `Rainfall of about ${rain.toFixed(0)} mm is expected in the next 24 hours.` }, { priority: 'high', title: 'Keep drainage clear', detail: 'Inspect field channels and remove standing water before the rain spell.' }] : [{ priority: 'medium', title: 'Plan irrigation early morning', detail: 'Low rainfall is expected; prioritize the most moisture-sensitive growth stage.' }]
  if (panchayat.humidity >= 78) actions.push({ priority: 'medium', title: 'Monitor weather-based disease risk', detail: 'High humidity may favour fungal pressure; inspect canopy symptoms. This is not a disease diagnosis.' })
  actions.push({ priority: 'low', title: 'Recheck after 24 hours', detail: 'Weather and soil conditions can change quickly; use the next forecast cycle for the next decision.' })
  return { crop: String(payload.crop || 'Paddy'), variety: String(payload.variety || 'Conventional'), growth_stage: String(payload.growth_stage || 'Vegetative'), title: language === 'ta' ? (rain >= 15 ? 'மழை எதிர்பார்ப்பு: பாசனம் தவிர்த்து வடிகால் பாதுகாக்கவும்' : 'பாசனம் மற்றும் பயிர் கண்காணிப்பு தொடரவும்') : rain >= 15 ? 'Rainfall window: hold irrigation and protect drainage' : 'Maintain a measured irrigation and crop-monitoring plan', summary: language === 'ta' ? `அடுத்த 24 மணி நேரத்தில் ${rain.toFixed(0)} மி.மீ. மழை எதிர்பார்க்கப்படுகிறது. நீர் ஈரப்பதம் ${panchayat.soil_moisture.toFixed(0)}%.` : `${rain.toFixed(0)} mm rainfall is expected in the next 24 hours. Current soil moisture is ${panchayat.soil_moisture.toFixed(0)}%.`, actions, weather: { temperature: panchayat.temperature, rainfall: rain, humidity: panchayat.humidity, soil_moisture: panchayat.soil_moisture }, water_requirement_mm: Math.round(125 * farmArea), confidence: panchayat.confidence, confidence_label: 'High', why: [`Rainfall forecast is ${rain.toFixed(1)} mm for the next 24 hours.`, `Soil moisture is ${panchayat.soil_moisture.toFixed(0)}% and temperature is ${panchayat.temperature.toFixed(1)}°C.`, `${String(payload.crop || 'Paddy')} at ${String(payload.growth_stage || 'Vegetative').toLowerCase()} is in the active advisory window.`], data_label: 'Prototype Demonstration Dataset' }
}

function localIrrigation(payload: Record<string, unknown>) {
  const panchayat = panchayatOrFirst(String(payload.panchayat_id || 'p-01'))
  const moisture = Number(payload.soil_moisture ?? panchayat.soil_moisture)
  const rain = Number(payload.rainfall_forecast ?? localForecast.forecast[0].panchayat_rainfall)
  const temperature = Number(payload.temperature ?? panchayat.temperature)
  const humidity = Number(payload.humidity ?? panchayat.humidity)
  let recommendation = rain >= 18 || moisture >= 62 ? 'NO IRRIGATION REQUIRED' : moisture < 34 || (temperature >= 33 && moisture < 43) ? 'IRRIGATE NOW' : 'IRRIGATE LATER'
  if (humidity >= 82 && recommendation === 'IRRIGATE NOW') recommendation = 'IRRIGATE LATER'
  return { recommendation, reason: recommendation === 'NO IRRIGATION REQUIRED' ? 'Expected rainfall is sufficient and current soil moisture is adequate.' : recommendation === 'IRRIGATE NOW' ? 'Low root-zone moisture and evapotranspiration indicate near-term water stress.' : 'Soil moisture is workable, but the crop will need water before the next dry period.', timing: recommendation === 'IRRIGATE NOW' ? 'Irrigate in the next available early-morning window' : 'Reassess in 12–24 hours', current_soil_moisture: moisture, expected_rainfall: rain, temperature, humidity, estimated_water_requirement_mm: recommendation === 'NO IRRIGATION REQUIRED' ? 0 : recommendation === 'IRRIGATE NOW' ? 20 : 10, confidence: 84, confidence_label: 'High', why: [`Soil moisture reading: ${moisture.toFixed(0)}%.`, `Rainfall in the forecast window: ${rain.toFixed(0)} mm.`, 'Crop-stage water reference used for the rule-based estimate.'], data_label: 'Prototype Demonstration Dataset' }
}

function localRisk(panchayatId: string): RiskResponse {
  const p = panchayatOrFirst(panchayatId)
  const items: RiskItem[] = [
    { type: 'Heavy Rain', level: p.rainfall >= 40 ? 'High' : p.rainfall >= 25 ? 'Moderate' : 'Low', probability: Math.min(96, Math.round(18 + p.rainfall * 1.65)), reasons: [`Rainfall forecast is ${p.rainfall.toFixed(1)} mm`, 'Block and local forecast comparison completed'], action: 'Ensure drainage channels are clear and postpone irrigation.' },
    { type: 'Flood', level: p.flood_risk >= 65 ? 'High' : p.flood_risk >= 35 ? 'Moderate' : 'Low', probability: p.flood_risk, reasons: [`Distance to water body: ${p.distance_to_water} km`, `Soil moisture: ${p.soil_moisture.toFixed(0)}%`], action: 'Inspect low-lying field sections and clear outlet paths.' },
    { type: 'Drought', level: p.drought_risk >= 65 ? 'High' : p.drought_risk >= 35 ? 'Moderate' : 'Low', probability: p.drought_risk, reasons: [`Soil moisture deficit indicator: ${Math.max(0, 45 - p.soil_moisture).toFixed(0)} points`, `Rainfall forecast: ${p.rainfall.toFixed(1)} mm`], action: 'Review irrigation supply and prioritize critical growth stages.' },
    { type: 'Heat Stress', level: p.heat_risk >= 65 ? 'High' : p.heat_risk >= 35 ? 'Moderate' : 'Low', probability: p.heat_risk, reasons: [`Temperature: ${p.temperature.toFixed(1)}°C`, `Relative humidity: ${p.humidity.toFixed(0)}%`], action: 'Irrigate early morning and provide temporary shade where possible.' },
    { type: 'High Humidity', level: p.humidity >= 82 ? 'High' : p.humidity >= 72 ? 'Moderate' : 'Low', probability: p.humidity_risk, reasons: [`Forecast humidity: ${p.humidity.toFixed(0)}%`, 'Weather-based disease pressure indicator only'], action: 'Inspect canopy symptoms and improve field ventilation; this is not a diagnosis.' },
    { type: 'Wind Damage', level: p.wind_speed >= 25 ? 'High' : p.wind_speed >= 17 ? 'Moderate' : 'Low', probability: p.wind_risk, reasons: [`Wind speed: ${p.wind_speed.toFixed(1)} km/h`], action: 'Stake tall crops and secure lightweight field equipment.' },
  ]
  const overall = [...items].sort((a, b) => b.probability - a.probability)[0]
  return { panchayat: p.name, overall_risk: overall.level, risk_score: overall.probability, risks: [...items], confidence: p.confidence, data_label: 'Prototype Demonstration Dataset', disclaimer: 'Disease-related outputs are weather-based risk signals, not definitive diagnoses.' }
}

export const api = {
  async login(role: User['role']): Promise<User> {
    if (!forcedDemo) {
      try { return await request<User>('/auth/login', json('POST', { role, email: `${role}@agronova.demo`, password: 'demo123' })) } catch { lastRequestWasFallback = true }
    }
    return { ...localUser, id: `demo-${role}`, role, name: role === 'farmer' ? 'Kavitha R' : role === 'officer' ? 'Murugan S' : 'AgroNova Admin', email: `${role}@agronova.demo`, token: `demo-token-${role}` }
  },
  async context() { try { return await request<Record<string, string>>('/locations/context') } catch { return { state: 'Tamil Nadu', district: 'Madurai', block: 'Demo Block', panchayat: 'Demo Panchayat', state_code: 'TN', district_id: 'tn-madurai', block_id: 'demo-block', panchayat_id: 'p-01' } } },
  async panchayats(): Promise<Panchayat[]> { try { const response = await request<{ items: Panchayat[] }>('/panchayats/demo-block'); return response.items } catch { return localPanchayats } },
  async current(panchayatId?: string): Promise<CurrentWeather> { try { return await request<CurrentWeather>(`/weather/current${panchayatId ? `?panchayat_id=${encodeURIComponent(panchayatId)}` : ''}`) } catch { return { location: panchayatId ? panchayatOrFirst(panchayatId) : localForecast.block, source: 'Prototype demonstration fallback', data_label: 'Prototype Demonstration Dataset' } } },
  async forecast(panchayatId?: string): Promise<ForecastResponse> { try { return await request<ForecastResponse>(`/weather/forecast${panchayatId ? `?panchayat_id=${encodeURIComponent(panchayatId)}` : ''}`) } catch { if (!panchayatId) return localForecast; const p = panchayatOrFirst(panchayatId); const tempDelta = p.temperature - localForecast.block.temperature; const rainDelta = p.rainfall - localForecast.block.rainfall; const humidityDelta = p.humidity - localForecast.block.humidity; const windDelta = p.wind_speed - localForecast.block.wind_speed; return { ...localForecast, panchayat_id: p.id, source: 'Prototype spatial comparison', forecast: localForecast.forecast.map((day) => ({ ...day, panchayat_temperature: Math.round((day.panchayat_temperature + tempDelta) * 10) / 10, panchayat_rainfall: Math.round(Math.max(0, day.panchayat_rainfall + rainDelta) * 10) / 10, humidity: Math.round(Math.min(100, Math.max(0, day.humidity + humidityDelta))), wind_speed: Math.round(Math.max(0, day.wind_speed + windDelta) * 10) / 10 })) } } },
  async downscale(model: 'random_forest' | 'xgboost' | 'baseline' = 'random_forest'): Promise<{ status: string; panchayats: DownscaleResult[]; processed_at: string; data_label: string }> { try { return await request<{ status: string; panchayats: DownscaleResult[]; processed_at: string; data_label: string }>('/downscaling/predict', json('POST', { block_id: 'demo-block', model, include_baseline: true })) } catch { return { status: 'completed', panchayats: localDownscale(model), processed_at: new Date().toISOString(), data_label: 'Prototype Demonstration Dataset' } } },
  async downscaleResult(id: string): Promise<DownscaleResult> { try { return await request<DownscaleResult>(`/downscaling/results/${id}`) } catch { return localDownscale().find((item) => item.panchayat_id === id) || localDownscale()[0] } },
  async metrics(): Promise<ModelMetrics> { try { return await request<ModelMetrics>('/downscaling/metrics') } catch { return localMetrics() } },
  async crops() { try { const response = await request<{ items: typeof localCrops }>('/crops'); return response.items } catch { return localCrops } },
  async advisory(payload: Record<string, unknown>): Promise<Advisory> { try { return await request<Advisory>('/advisory/generate', json('POST', payload)) } catch { return localAdvisory(payload) } },
  async irrigation(payload: Record<string, unknown>): Promise<IrrigationRecommendation> { try { return await request<IrrigationRecommendation>('/irrigation/recommend', json('POST', payload)) } catch { return localIrrigation(payload) } },
  async risk(id: string): Promise<RiskResponse> { try { return await request<RiskResponse>(`/risk/${id}`) } catch { return localRisk(id) } },
  async satellite(id: string): Promise<SatelliteResponse> { try { return await request<SatelliteResponse>(`/satellite/${id}`) } catch { const p = panchayatOrFirst(id); const change = (p.ndvi - p.ndvi_previous) / p.ndvi_previous * 100; return { panchayat: p.name, ndvi: p.ndvi, previous_ndvi: p.ndvi_previous, change_percent: change, status: change < -3 ? 'Moderate vegetation stress' : 'Vegetation stable', ndwi: p.ndwi, land_surface_temperature: p.land_surface_temperature, geometry: p.geometry, data_label: 'Prototype Demonstration Dataset', source: 'Synthetic satellite indicator demo' } } },
  async alerts(): Promise<AlertItem[]> { try { const response = await request<{ items: AlertItem[] }>('/alerts'); return response.items } catch { return localAlerts } },
  async markAlertRead(id: string, isRead = true): Promise<AlertItem> { try { return await request<AlertItem>(`/alerts/${id}/read`, json('POST', { is_read: isRead })) } catch { const item = localAlerts.find((alert) => alert.id === id); if (item) item.is_read = isRead; return item || localAlerts[0] } },
  async history(id: string, variable: string, days = 30): Promise<HistoryResponse> { try { return await request<HistoryResponse>(`/history/${id}?variable=${variable}&days=${days}`) } catch { const rows = localHistory(panchayatOrFirst(id), variable, days); const values = rows.map((row) => Number(row[variable])); const average = values.reduce((sum, value) => sum + value, 0) / values.length; return { variable, rows, summary: { average: Math.round(average * 100) / 100, maximum: Math.max(...values), minimum: Math.min(...values), anomaly: Math.round((values[values.length - 1] - average) * 100) / 100, trend: values[values.length - 1] > average ? 'rising' : 'falling' }, data_label: 'Prototype Demonstration Dataset' } } },
  async simulation(payload: Record<string, unknown>): Promise<SimulationResponse> { try { return await request<SimulationResponse>('/simulation', json('POST', payload)) } catch { const p = panchayatOrFirst(String(payload.panchayat_id || 'p-01')); const rain = Math.max(0, p.rainfall * (1 + Number(payload.rainfall_change_percent || 0) / 100)); const temp = p.temperature + Number(payload.temperature_change_c || 0); const moisture = Math.max(0, Math.min(100, p.soil_moisture * (1 + Number(payload.soil_moisture_change_percent || 0) / 100))); const humidity = Math.max(0, Math.min(100, p.humidity * (1 + Number(payload.humidity_change_percent || 0) / 100))); const stress = Math.min(98, Math.max(8, p.crop_stress + (temp - p.temperature) * 4.2 + (p.rainfall - rain) * 0.34 + (p.soil_moisture - moisture) * 0.42 + (p.humidity - humidity) * 0.08)); return { baseline: { rainfall: p.rainfall, temperature: p.temperature, humidity: p.humidity, soil_moisture: p.soil_moisture, crop_stress: p.crop_stress, water_requirement: 42, irrigation: 'Review today' }, scenario: { rainfall: Math.round(rain * 10) / 10, temperature: Math.round(temp * 10) / 10, humidity: Math.round(humidity * 10) / 10, soil_moisture: Math.round(moisture * 10) / 10, crop_stress: Math.round(stress * 10) / 10, water_requirement: Math.max(5, 42 + (temp - p.temperature) * 3.8 - (rain - p.rainfall) * 0.22), irrigation: stress >= 70 || moisture < 35 ? 'Irrigate now' : stress >= 45 ? 'Irrigate later' : 'No irrigation required' }, changes: { crop_stress: Math.round((stress - p.crop_stress) * 10) / 10, water_requirement: Math.round((temp - p.temperature) * 3.8 - (rain - p.rainfall) * 0.22), heat_risk: Math.max(0, (temp - 29) * 8), drought_risk: Math.min(100, Math.max(0, 65 - moisture + Math.max(0, 28 - rain))) }, label: 'Simulated estimate — not a forecast', data_label: 'Prototype Demonstration Dataset' } } },
  async monitoring(): Promise<{ summary: Record<string, number>; rows: OfficerRow[] }> { try { return await request<{ summary: Record<string, number>; rows: OfficerRow[] }>('/officer/monitoring') } catch { const rows = localPanchayats.map((p) => ({ panchayat: p.name, panchayat_id: p.id, risk: p.risk_status, crop: p.crop, rainfall: p.rainfall, soil_moisture: p.soil_moisture, crop_stress: p.crop_stress, recommended_action: p.risk_status === 'Normal' ? 'Continue regular monitoring.' : 'Inspect field and review the next forecast.' })); return { summary: { total_panchayats: rows.length, at_risk: rows.filter((row) => row.risk !== 'Normal').length, heavy_rain_alerts: 3, drought_alerts: 2, crop_stress_areas: rows.filter((row) => row.crop_stress >= 60).length }, rows } } },
}
