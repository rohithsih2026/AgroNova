export const formatNumber = (value: number, digits = 1) => Number.isFinite(value) ? value.toFixed(digits) : '—'
export const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
export const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase())
