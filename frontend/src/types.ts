export type Role = 'farmer' | 'officer' | 'administrator'
export type RiskLevel = 'Normal' | 'Moderate' | 'High' | 'Critical' | 'Low'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  organization: string
  token: string
  demo: boolean
  data_label?: string
}

export interface LocationContext {
  state: string
  district: string
  block: string
  panchayat: string
  state_code: string
  district_id: string
  block_id: string
  panchayat_id: string
}

export interface Panchayat {
  id: string
  name: string
  block_id: string
  block: string
  district: string
  state: string
  latitude: number
  longitude: number
  elevation: number
  land_use: string
  vegetation_index: number
  soil_type: string
  distance_to_water: number
  crop: string
  growth_stage: string
  temperature: number
  rainfall: number
  humidity: number
  wind_speed: number
  pressure: number
  cloud_cover: number
  solar_radiation: number
  soil_moisture: number
  crop_stress: number
  drought_risk: number
  flood_risk: number
  heat_risk: number
  wind_risk: number
  humidity_risk: number
  confidence: number
  risk_status: RiskLevel
  risk_color: string
  ndvi: number
  ndvi_previous: number
  ndwi: number
  land_surface_temperature: number
  geometry: { type: string; coordinates: number[][][] }
}

export interface ForecastDay {
  date: string
  label: string
  block_temperature: number
  panchayat_temperature: number
  block_rainfall: number
  panchayat_rainfall: number
  humidity: number
  wind_speed: number
  pressure: number
  cloud_cover: number
  rain_probability: number
}

export interface HourlyWeather {
  time: string
  timestamp: string
  temperature: number
  rainfall: number
  humidity: number
  wind_speed: number
  rain_probability: number
}

export interface ForecastResponse {
  block: Record<string, any>
  forecast: ForecastDay[]
  hourly: HourlyWeather[]
  data_label: string
  panchayat_id?: string
  source?: string
}

export interface CurrentWeather {
  location: Record<string, any>
  source: string
  data_label: string
}

export interface DownscaleResult {
  panchayat_id: string
  panchayat: string
  temperature: number
  rainfall: number
  humidity: number
  wind: number
  soil_moisture: number
  confidence: number
  baseline: Record<string, number>
  explanation: string[]
  model_version: string
  model_used?: string
  generated_at?: string
}

export interface ModelMetric {
  variable: string
  mae: number
  rmse: number
  r2: number
  unit: string
}

export interface ModelMetrics {
  dataset_label: string
  model: string
  model_version: string
  metrics: ModelMetric[]
  chart: Array<{ point: number; actual: number; predicted: number; variable: string }>
  confidence: number
  confidence_label: string
  note: string
  importance: Array<{ feature: string; importance: number }>
}

export interface Crop {
  id: string
  name: string
  icon: string
  water_requirement_mm: number
  stages: string[]
}

export interface Advisory {
  crop: string
  variety: string
  growth_stage: string
  title: string
  summary: string
  actions: Array<{ priority: string; title: string; detail: string }>
  weather: Record<string, number>
  water_requirement_mm: number
  confidence: number
  confidence_label: string
  why: string[]
  data_label: string
}

export interface IrrigationRecommendation {
  recommendation: string
  reason: string
  timing: string
  current_soil_moisture: number
  expected_rainfall: number
  temperature: number
  humidity: number
  estimated_water_requirement_mm: number
  confidence: number
  confidence_label: string
  why: string[]
  data_label: string
}

export interface RiskItem {
  type: string
  level: RiskLevel
  probability: number
  reasons: string[]
  action: string
}

export interface RiskResponse {
  panchayat: string
  overall_risk: RiskLevel
  risk_score: number
  risks: RiskItem[]
  confidence: number
  data_label: string
  disclaimer: string
}

export interface SatelliteResponse {
  panchayat: string
  ndvi: number
  previous_ndvi: number
  change_percent: number
  status: string
  ndwi: number
  land_surface_temperature: number
  geometry: Panchayat['geometry']
  data_label: string
  source: string
}

export interface AlertItem {
  id: string
  type: string
  severity: string
  title: string
  panchayat: string
  panchayat_id: string
  message: string
  time: string
  created_at: string
  is_read: boolean
  recommended_action: string
}

export interface SimulationResponse {
  baseline: Record<string, number | string>
  scenario: Record<string, number | string>
  changes: Record<string, number>
  label: string
  data_label: string
}

export interface HistoryResponse {
  variable: string
  rows: Array<Record<string, string | number>>
  summary: { average: number; maximum: number; minimum: number; anomaly: number; trend: string }
  data_label: string
}

export interface OfficerRow {
  panchayat: string
  panchayat_id: string
  risk: RiskLevel
  crop: string
  rainfall: number
  soil_moisture: number
  crop_stress: number
  recommended_action: string
}
