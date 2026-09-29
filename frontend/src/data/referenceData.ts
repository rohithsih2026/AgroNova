import type { AlertItem, Crop, ForecastResponse, Panchayat, User } from '../types'

export const DATA_LABEL = 'AgroNova model estimate'
export const BLOCK_ID = 'ulundurpettai-block'
export const BLOCK_NAME = 'Ulundurpettai'
export const DISTRICT = 'Viluppuram'
export const STATE = 'Tamil Nadu'
export const SERVICE_AREA = 'Ulundurpettai Block, Viluppuram District'

// id, name, latitude, longitude, elevation (m), land use, vegetation index, soil, distance to water (km), crop, growth stage
const specs: Array<[string, string, number, number, number, string, number, string, number, string, string]> = [
  ['p-01', 'Ulundurpettai', 11.9833, 79.3167, 122, 'agriculture', 0.57, 'red loamy', 1.2, 'Paddy', 'Vegetative'],
  ['p-02', 'Pidagam', 11.9086, 79.3833, 96, 'mixed', 0.49, 'red sandy', 3.4, 'Groundnut', 'Pod development'],
  ['p-03', 'Sendamangalam', 12.01, 79.3667, 118, 'agriculture', 0.63, 'red loamy', 1.6, 'Sugarcane', 'Grand growth'],
  ['p-04', 'Tirunavalur', 11.95, 79.25, 137, 'agriculture', 0.58, 'red loamy', 0.9, 'Paddy', 'Flowering'],
  ['p-05', 'Eraiyur', 11.9167, 79.2333, 152, 'agriculture', 0.51, 'black', 4.1, 'Cotton', 'Squaring'],
  ['p-06', 'Sengurichi', 12.05, 79.2833, 176, 'mixed', 0.44, 'red sandy', 5.6, 'Maize', 'Grain filling'],
  ['p-07', 'Periyakurukkai', 11.8667, 79.3167, 88, 'agriculture', 0.66, 'alluvial', 0.7, 'Paddy', 'Vegetative'],
  ['p-08', 'Vellaiyur', 11.9333, 79.3833, 128, 'agriculture', 0.54, 'red loamy', 2.2, 'Onion', 'Bulb initiation'],
]

const polygon = (lat: number, lon: number, index: number) => {
  const width = 0.024 + (index % 3) * 0.003
  const height = 0.019 + (index % 2) * 0.003
  return [[[lon - width, lat - height], [lon + width, lat - height * 0.8], [lon + width * 0.92, lat + height], [lon - width * 0.86, lat + height * 0.88], [lon - width, lat - height]]]
}

export const localPanchayats: Panchayat[] = specs.map(([id, name, lat, lon, elevation, landUse, ndvi, soil, water, crop, stage], index) => {
  const temperature = Math.round((31.4 + index * 0.22 + Math.sin(index * 1.7) * 0.6) * 10) / 10
  const rainfall = Math.round(Math.max(2, 21.5 - index * 1.6 + Math.cos(index) * 3.6) * 10) / 10
  const humidity = Math.round(Math.min(94, 68 + index * 1.2 + Math.sin(index * 0.9) * 2.6) * 10) / 10
  const wind = Math.round((9.5 + index * 0.7 + Math.cos(index * 1.2) * 2) * 10) / 10
  const moisture = Math.round(Math.max(24, 50 - index * 1.5 + (water < 2 ? 4 : 0)) * 10) / 10
  const stress = Math.round(Math.min(92, Math.max(18, 41 + index * 3 + (ndvi < 0.55 ? 11 : 0))) * 10) / 10
  const risk = rainfall > 42 || moisture < 30 ? 'Critical' : rainfall > 32 || stress > 66 ? 'High' : rainfall > 22 || moisture < 42 ? 'Moderate' : 'Normal'
  return { id, name, block_id: BLOCK_ID, block: BLOCK_NAME, district: DISTRICT, state: STATE, latitude: lat, longitude: lon, elevation, land_use: landUse, vegetation_index: ndvi, soil_type: soil, distance_to_water: water, crop, growth_stage: stage, temperature, rainfall, humidity, wind_speed: wind, pressure: Math.round((1007.2 + Math.sin(index) * 3) * 10) / 10, cloud_cover: Math.round(38 + index * 3.2), solar_radiation: Math.round((5.9 + Math.cos(index) * 0.7) * 10) / 10, soil_moisture: moisture, crop_stress: stress, drought_risk: Math.round(Math.max(5, 64 - moisture * 0.75 + (24 - rainfall) * 0.35) * 10) / 10, flood_risk: Math.round(Math.min(94, 16 + rainfall * 1.1 + (water < 2 ? 12 : 0)) * 10) / 10, heat_risk: Math.round(Math.min(96, Math.max(8, (temperature - 28) * 12 + Math.max(0, 38 - humidity) * 0.7)) * 10) / 10, wind_risk: Math.round(Math.min(92, Math.max(5, wind * 4.5)) * 10) / 10, humidity_risk: Math.round(Math.min(94, Math.max(6, (humidity - 68) * 2.4)) * 10) / 10, confidence: Math.round((86 - index * 0.8) * 10) / 10, risk_status: risk as Panchayat['risk_status'], risk_color: risk === 'Normal' ? 'green' : risk === 'Moderate' ? 'yellow' : risk === 'High' ? 'orange' : 'red', ndvi, ndvi_previous: Math.round((ndvi + 0.05 + index * 0.003) * 100) / 100, ndwi: Math.round((0.19 + water / 40 + Math.sin(index) * 0.02) * 100) / 100, land_surface_temperature: Math.round((temperature + 2.4 + index * 0.1) * 10) / 10, geometry: { type: 'Polygon', coordinates: polygon(lat, lon, index) } }
})

const forecastRain = [14.2, 27.6, 8.4, 3.1, 6.8, 21.3, 11.7]
const forecastTemp = [32.1, 31.2, 30.4, 31.8, 32.6, 31.4, 32.2]
const forecastHumidity = [72, 79, 75, 66, 62, 76, 70]
const forecastWind = [12, 15, 11, 9, 10, 14, 12]
const forecastProbability = [36, 61, 27, 15, 22, 52, 33]
const dateAt = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10)

export const localForecast: ForecastResponse = {
  block: { location_id: BLOCK_ID, location_name: BLOCK_NAME, district: DISTRICT, state: STATE, latitude: 11.98, longitude: 79.31, temperature: 31.8, rainfall: 19.4, humidity: 70, wind_speed: 11, pressure: 1007, cloud_cover: 46, solar_radiation: 5.9, updated_at: new Date().toISOString() },
  forecast: forecastRain.map((rain, index) => ({ date: dateAt(index), label: new Date(Date.now() + index * 86400000).toLocaleDateString('en-US', { weekday: 'short' }), block_temperature: Math.round((forecastTemp[index] - 0.2) * 10) / 10, panchayat_temperature: forecastTemp[index], block_rainfall: Math.round(rain * 0.88 * 10) / 10, panchayat_rainfall: rain, humidity: forecastHumidity[index], wind_speed: forecastWind[index], pressure: Math.round((1007 + Math.sin(index) * 4) * 10) / 10, cloud_cover: Math.round(38 + rain * 1.2), rain_probability: forecastProbability[index] })),
  hourly: Array.from({ length: 24 }, (_, index) => ({ time: `${String(index).padStart(2, '0')}:00`, timestamp: new Date(Date.now() + index * 3600000).toISOString(), temperature: Math.round((30.1 + Math.sin((index - 6) / 24 * Math.PI * 2) * 3.1 + index * 0.04) * 10) / 10, rainfall: index >= 14 && index <= 18 ? 1.9 : Math.max(0, Math.round((0.3 + Math.sin(index) * 0.2) * 10) / 10), humidity: Math.round((71 - Math.sin((index - 6) / 24 * Math.PI * 2) * 12) * 10) / 10, wind_speed: Math.round((11 + Math.cos(index / 3) * 3.5) * 10) / 10, rain_probability: Math.round(26 + (index >= 14 && index <= 18 ? 30 : 0) + Math.sin(index) * 7) })),
  data_label: DATA_LABEL,
}

export const localCrops: Crop[] = [
  { id: 'paddy', name: 'Paddy', icon: '🌾', water_requirement_mm: 125, stages: ['Nursery', 'Vegetative', 'Flowering', 'Panicle initiation', 'Maturity'] },
  { id: 'maize', name: 'Maize', icon: '🌽', water_requirement_mm: 95, stages: ['Germination', 'Vegetative', 'Flowering', 'Grain filling', 'Maturity'] },
  { id: 'cotton', name: 'Cotton', icon: '🧵', water_requirement_mm: 110, stages: ['Germination', 'Vegetative', 'Squaring', 'Flowering', 'Boll development'] },
  { id: 'groundnut', name: 'Groundnut', icon: '🥜', water_requirement_mm: 85, stages: ['Germination', 'Vegetative', 'Flowering', 'Pod development', 'Maturity'] },
  { id: 'sugarcane', name: 'Sugarcane', icon: '🎋', water_requirement_mm: 165, stages: ['Germination', 'Tillering', 'Grand growth', 'Maturity'] },
  { id: 'onion', name: 'Onion', icon: '🧅', water_requirement_mm: 90, stages: ['Establishment', 'Vegetative', 'Bulb initiation', 'Maturity'] },
  { id: 'tomato', name: 'Tomato', icon: '🍅', water_requirement_mm: 105, stages: ['Establishment', 'Vegetative', 'Flowering', 'Fruit set', 'Harvest'] },
  { id: 'pulses', name: 'Pulses', icon: '🫘', water_requirement_mm: 70, stages: ['Germination', 'Vegetative', 'Flowering', 'Pod development', 'Maturity'] },
  { id: 'sorghum', name: 'Sorghum', icon: '🌱', water_requirement_mm: 65, stages: ['Germination', 'Vegetative', 'Flowering', 'Grain filling', 'Maturity'] },
]

export const localAlerts: AlertItem[] = [
  { id: 'alert-01', type: 'Heavy Rain', severity: 'High', title: 'Heavy rain alert', panchayat: 'Tirunavalur', panchayat_id: 'p-04', message: 'Heavy rainfall is likely over the next 24 hours in and around Tirunavalur. Postpone irrigation and keep field drains clear.', time: 'Next 24 hours', created_at: new Date().toISOString(), is_read: false, recommended_action: 'Postpone irrigation and clear field drains before the rain spell.' },
  { id: 'alert-02', type: 'Crop Stress', severity: 'Moderate', title: 'Vegetation stress watch', panchayat: 'Sengurichi', panchayat_id: 'p-06', message: 'Vegetation index has fallen while satellite-derived soil moisture is below the comfort range for maize grain filling.', time: 'Today', created_at: new Date().toISOString(), is_read: false, recommended_action: 'Inspect the maize canopy and schedule a soil moisture check.' },
  { id: 'alert-03', type: 'Irrigation Alert', severity: 'Moderate', title: 'Irrigation window available', panchayat: 'Periyakurukkai', panchayat_id: 'p-07', message: 'Satellite soil moisture is adequate for the next 12 hours. Reassess before the evening irrigation slot.', time: 'Next 12 hours', created_at: new Date().toISOString(), is_read: true, recommended_action: 'Recheck soil moisture before the evening slot.' },
  { id: 'alert-04', type: 'Heat Stress', severity: 'Low', title: 'Heat stress advisory', panchayat: 'Eraiyur', panchayat_id: 'p-05', message: 'Afternoon temperatures will raise evapotranspiration in cotton fields. Irrigate early morning if required.', time: 'This afternoon', created_at: new Date().toISOString(), is_read: false, recommended_action: 'Prefer early-morning irrigation and mulch exposed soil.' },
]

export const localUser: User = { id: 'user-farmer', name: 'Kavitha R', email: 'farmer@agronova.tn.in', role: 'farmer', organization: `Farmer · ${SERVICE_AREA}`, token: 'session-farmer', service_area: SERVICE_AREA, data_label: DATA_LABEL }

export const localHistory = (panchayat: Panchayat, variable: string, days = 30) => Array.from({ length: days }, (_, index) => {
  const wave = Math.sin(index / 3.4) + Math.cos(index / 6.2)
  const rainfall = Math.round(Math.max(0, 14 + wave * 7 + Math.sin(index * 1.8) * 3.4) * 10) / 10
  const temperature = Math.round((30.2 + Math.sin((index - 8) / 5) * 3 + (index % 4) * 0.2) * 10) / 10
  const humidity = Math.round(Math.min(97, Math.max(42, 70 - temperature * 0.25 + rainfall * 0.12)) * 10) / 10
  const moisture = Math.round(Math.max(22, Math.min(90, 44 + rainfall * 0.32 - (temperature - 30) * 0.7)) * 10) / 10
  const ndvi = Math.round(Math.max(0.25, Math.min(0.88, panchayat.ndvi + Math.sin(index / 8) * 0.05)) * 100) / 100
  return { date: dateAt(index - days + 1), rainfall, temperature, humidity, soil_moisture: moisture, ndvi, [variable]: variable === 'rainfall' ? rainfall : variable === 'temperature' ? temperature : variable === 'humidity' ? humidity : variable === 'soil_moisture' ? moisture : ndvi }
})
