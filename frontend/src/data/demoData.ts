import type { AlertItem, Crop, ForecastResponse, Panchayat, User } from '../types'

const specs: Array<[string, string, number, number, number, string, number, string, number, string, string]> = [
  ['p-01', 'Demo Panchayat', 9.925, 78.119, 238, 'agriculture', 0.68, 'red loamy', 1.8, 'Paddy', 'Vegetative'],
  ['p-02', 'Kozhippara', 9.948, 78.145, 276, 'mixed', 0.61, 'red loamy', 2.6, 'Maize', 'Flowering'],
  ['p-03', 'Melur', 9.905, 78.151, 254, 'agriculture', 0.64, 'alluvial', 3.1, 'Paddy', 'Vegetative'],
  ['p-04', 'Vadipatti', 9.982, 78.195, 289, 'agriculture', 0.57, 'red sandy', 4.8, 'Groundnut', 'Pod development'],
  ['p-05', 'Thirunagaram', 9.892, 78.087, 211, 'agriculture', 0.71, 'black', 1.2, 'Sugarcane', 'Tillering'],
  ['p-06', 'Usilampatti', 9.875, 78.142, 318, 'mixed', 0.53, 'red loamy', 5.4, 'Cotton', 'Squaring'],
  ['p-07', 'Tiruppudaimundu', 9.958, 78.068, 229, 'forest', 0.73, 'red loamy', 0.9, 'Banana', 'Fruit development'],
  ['p-08', 'Pannaipuram', 9.932, 78.188, 264, 'agriculture', 0.59, 'sandy', 4.1, 'Tomato', 'Flowering'],
]

const polygon = (lat: number, lon: number, index: number) => {
  const width = 0.024 + (index % 3) * 0.003
  const height = 0.019 + (index % 2) * 0.003
  return [[[lon - width, lat - height], [lon + width, lat - height * 0.8], [lon + width * 0.92, lat + height], [lon - width * 0.86, lat + height * 0.88], [lon - width, lat - height]]]
}

export const localPanchayats: Panchayat[] = specs.map(([id, name, lat, lon, elevation, landUse, ndvi, soil, water, crop, stage], index) => {
  const temperature = Math.round((30.1 + index * 0.24 + Math.sin(index * 1.7) * 0.7) * 10) / 10
  const rainfall = Math.round(Math.max(2, 27.5 - index * 2.1 + Math.cos(index) * 4.2) * 10) / 10
  const humidity = Math.round(Math.min(96, 73 + index * 1.4 + Math.sin(index * 0.9) * 3) * 10) / 10
  const wind = Math.round((10.5 + index * 0.8 + Math.cos(index * 1.2) * 2.2) * 10) / 10
  const moisture = Math.round(Math.max(24, 53 - index * 1.7 + (water < 2 ? 4 : 0)) * 10) / 10
  const stress = Math.round(Math.min(92, Math.max(18, 43 + index * 3.1 + (ndvi < 0.6 ? 12 : 0))) * 10) / 10
  const risk = rainfall > 48 || moisture < 30 ? 'Critical' : rainfall > 38 || stress > 68 ? 'High' : rainfall > 28 || moisture < 43 ? 'Moderate' : 'Normal'
  return { id, name, block_id: 'demo-block', block: 'Demo Block', district: 'Madurai', state: 'Tamil Nadu', latitude: lat, longitude: lon, elevation, land_use: landUse, vegetation_index: ndvi, soil_type: soil, distance_to_water: water, crop, growth_stage: stage, temperature, rainfall, humidity, wind_speed: wind, pressure: Math.round((1007.5 + Math.sin(index) * 3.2) * 10) / 10, cloud_cover: Math.round(46 + index * 3.5), solar_radiation: Math.round((5.4 + Math.cos(index) * 0.8) * 10) / 10, soil_moisture: moisture, crop_stress: stress, drought_risk: Math.round(Math.max(5, 66 - moisture * 0.75 + (25 - rainfall) * 0.35) * 10) / 10, flood_risk: Math.round(Math.min(96, 18 + rainfall * 1.15 + (water < 2 ? 12 : 0)) * 10) / 10, heat_risk: Math.round(Math.min(98, Math.max(8, (temperature - 27) * 12 + Math.max(0, 36 - humidity) * 0.7)) * 10) / 10, wind_risk: Math.round(Math.min(95, Math.max(5, wind * 4.5)) * 10) / 10, humidity_risk: Math.round(Math.min(96, Math.max(6, (humidity - 68) * 2.4)) * 10) / 10, confidence: Math.round((86 - index * 0.8) * 10) / 10, risk_status: risk as Panchayat['risk_status'], risk_color: risk === 'Normal' ? 'green' : risk === 'Moderate' ? 'yellow' : risk === 'High' ? 'orange' : 'red', ndvi, ndvi_previous: Math.round((ndvi + 0.06 + index * 0.003) * 100) / 100, ndwi: Math.round((0.21 + water / 35 + Math.sin(index) * 0.02) * 100) / 100, land_surface_temperature: Math.round((temperature + 2.2 + index * 0.12) * 10) / 10, geometry: { type: 'Polygon', coordinates: polygon(lat, lon, index) } }
})

const forecastRain = [18.6, 32.4, 11.2, 4.8, 8.6, 25.4, 15.1]
const forecastTemp = [31.0, 30.2, 29.6, 31.4, 32.0, 30.8, 31.7]
const forecastHumidity = [76, 82, 78, 70, 66, 79, 74]
const forecastWind = [14, 17, 12, 10, 11, 16, 13]
const forecastProbability = [42, 68, 31, 18, 26, 57, 38]
const dateAt = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10)

export const localForecast: ForecastResponse = {
  block: { location_id: 'demo-block', location_name: 'Demo Block', district: 'Madurai', state: 'Tamil Nadu', temperature: 31, rainfall: 24, humidity: 74, wind_speed: 12, pressure: 1008, cloud_cover: 48, solar_radiation: 5.8, updated_at: new Date().toISOString() },
  forecast: forecastRain.map((rain, index) => ({ date: dateAt(index), label: new Date(Date.now() + index * 86400000).toLocaleDateString('en-US', { weekday: 'short' }), block_temperature: Math.round((forecastTemp[index] - 0.2) * 10) / 10, panchayat_temperature: forecastTemp[index], block_rainfall: Math.round(rain * 0.88 * 10) / 10, panchayat_rainfall: rain, humidity: forecastHumidity[index], wind_speed: forecastWind[index], pressure: Math.round((1008 + Math.sin(index) * 4) * 10) / 10, cloud_cover: Math.round(42 + rain * 1.1), rain_probability: forecastProbability[index] })),
  hourly: Array.from({ length: 24 }, (_, index) => ({ time: `${String(index).padStart(2, '0')}:00`, timestamp: new Date(Date.now() + index * 3600000).toISOString(), temperature: Math.round((29.4 + Math.sin((index - 6) / 24 * Math.PI * 2) * 3.3 + index * 0.05) * 10) / 10, rainfall: index >= 13 && index <= 18 ? 2.2 : Math.max(0, Math.round((0.4 + Math.sin(index) * 0.2) * 10) / 10), humidity: Math.round((76 - Math.sin((index - 6) / 24 * Math.PI * 2) * 13) * 10) / 10, wind_speed: Math.round((12 + Math.cos(index / 3) * 4) * 10) / 10, rain_probability: Math.round(30 + (index >= 13 && index <= 18 ? 32 : 0) + Math.sin(index) * 8) })),
  data_label: 'Prototype Demonstration Dataset',
}

export const localCrops: Crop[] = [
  { id: 'paddy', name: 'Paddy', icon: '🌾', water_requirement_mm: 125, stages: ['Nursery', 'Vegetative', 'Flowering', 'Panicle initiation', 'Maturity'] },
  { id: 'maize', name: 'Maize', icon: '🌽', water_requirement_mm: 95, stages: ['Germination', 'Vegetative', 'Flowering', 'Grain filling', 'Maturity'] },
  { id: 'cotton', name: 'Cotton', icon: '☁️', water_requirement_mm: 110, stages: ['Germination', 'Vegetative', 'Squaring', 'Flowering', 'Boll development'] },
  { id: 'groundnut', name: 'Groundnut', icon: '🥜', water_requirement_mm: 85, stages: ['Germination', 'Vegetative', 'Flowering', 'Pod development', 'Maturity'] },
  { id: 'sugarcane', name: 'Sugarcane', icon: '🎋', water_requirement_mm: 165, stages: ['Germination', 'Tillering', 'Grand growth', 'Maturity'] },
  { id: 'banana', name: 'Banana', icon: '🍌', water_requirement_mm: 180, stages: ['Establishment', 'Vegetative', 'Flowering', 'Fruit development', 'Harvest'] },
  { id: 'tomato', name: 'Tomato', icon: '🍅', water_requirement_mm: 105, stages: ['Establishment', 'Vegetative', 'Flowering', 'Fruit set', 'Harvest'] },
  { id: 'onion', name: 'Onion', icon: '🧅', water_requirement_mm: 90, stages: ['Establishment', 'Vegetative', 'Bulb initiation', 'Maturity'] },
  { id: 'pulses', name: 'Pulses', icon: '🫘', water_requirement_mm: 70, stages: ['Germination', 'Vegetative', 'Flowering', 'Pod development', 'Maturity'] },
]

export const localAlerts: AlertItem[] = [
  { id: 'alert-01', type: 'Heavy Rain', severity: 'High', title: 'Heavy rain alert', panchayat: 'Demo Panchayat', panchayat_id: 'p-01', message: '65 mm rainfall is possible in the next 24 hours. Avoid irrigation and ensure drainage channels are clear.', time: 'Next 24 hours', created_at: new Date().toISOString(), is_read: false, recommended_action: 'Avoid irrigation and ensure proper drainage.' },
  { id: 'alert-02', type: 'Crop Stress', severity: 'Moderate', title: 'Vegetation stress watch', panchayat: 'Vadipatti', panchayat_id: 'p-04', message: 'NDVI decreased while soil moisture is below the comfort range for the current crop.', time: 'Today', created_at: new Date().toISOString(), is_read: false, recommended_action: 'Inspect crop canopy and schedule a soil moisture check.' },
  { id: 'alert-03', type: 'Irrigation Alert', severity: 'Moderate', title: 'Irrigation window available', panchayat: 'Usilampatti', panchayat_id: 'p-06', message: 'Soil moisture is adequate for the next 12 hours. Reassess before the evening irrigation slot.', time: 'Next 12 hours', created_at: new Date().toISOString(), is_read: true, recommended_action: 'Recheck moisture before the evening slot.' },
  { id: 'alert-04', type: 'Heat Stress', severity: 'Low', title: 'Heat stress advisory', panchayat: 'Pannaipuram', panchayat_id: 'p-08', message: 'Afternoon temperatures may increase evapotranspiration. Irrigate early morning if required.', time: 'This afternoon', created_at: new Date().toISOString(), is_read: false, recommended_action: 'Prefer early-morning irrigation and mulch exposed soil.' },
]

export const localUser: User = { id: 'demo-farmer', name: 'Kavitha R', email: 'farmer@agronova.demo', role: 'farmer', organization: 'Tamil Nadu Agriculture Department · Demo', token: 'demo-token-farmer', demo: true, data_label: 'Prototype Demonstration Dataset' }

export const localHistory = (panchayat: Panchayat, variable: string, days = 30) => Array.from({ length: days }, (_, index) => {
  const wave = Math.sin(index / 3.4) + Math.cos(index / 6.2)
  const rainfall = Math.round(Math.max(0, 17 + wave * 8 + Math.sin(index * 1.8) * 4) * 10) / 10
  const temperature = Math.round((29.2 + Math.sin((index - 8) / 5) * 3.2 + (index % 4) * 0.22) * 10) / 10
  const humidity = Math.round(Math.min(98, Math.max(42, 73 - temperature * 0.25 + rainfall * 0.12)) * 10) / 10
  const moisture = Math.round(Math.max(22, Math.min(90, 46 + rainfall * 0.35 - (temperature - 29) * 0.7)) * 10) / 10
  const ndvi = Math.round(Math.max(0.25, Math.min(0.88, panchayat.ndvi + Math.sin(index / 8) * 0.055)) * 100) / 100
  return { date: dateAt(index - days + 1), rainfall, temperature, humidity, soil_moisture: moisture, ndvi, [variable]: variable === 'rainfall' ? rainfall : variable === 'temperature' ? temperature : variable === 'humidity' ? humidity : variable === 'soil_moisture' ? moisture : ndvi }
})
