export const HEALTH_STATUS = {
  EXCELENTE: {
    color: '#0ea5e9',
    emoji: '🔵',
    label: 'Excelente',
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-900',
    borderColor: 'border-sky-200'
  },
  BUENO: {
    color: '#16a34a',
    emoji: '🟢',
    label: 'Bueno',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-300'
  },
  REGULAR: {
    color: '#f59e0b',
    emoji: '🟡',
    label: 'Regular',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-900',
    borderColor: 'border-amber-200'
  },
  MALO: {
    color: '#f97316',
    emoji: '🟠',
    label: 'Malo',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-900',
    borderColor: 'border-orange-200'
  },
  CRITICO: {
    color: '#dc2626',
    emoji: '🔴',
    label: 'Crítico',
    bgColor: 'bg-red-100',
    textColor: 'text-red-950',
    borderColor: 'border-red-400'
  }
} as const

export type HealthStatus = keyof typeof HEALTH_STATUS

export function getHealthColor(status?: string): string {
  if (!status || !(status in HEALTH_STATUS)) {
    return '#94a3b8'
  }
  return HEALTH_STATUS[status as HealthStatus].color
}

export function getHealthEmoji(status?: string): string {
  if (!status || !(status in HEALTH_STATUS)) {
    return '❓'
  }
  return HEALTH_STATUS[status as HealthStatus].emoji
}

export function getHealthLabel(status?: string): string {
  if (!status || !(status in HEALTH_STATUS)) {
    return 'Sin datos'
  }
  return HEALTH_STATUS[status as HealthStatus].label
}

export function getHealthStyles(status?: string) {
  if (!status || !(status in HEALTH_STATUS)) {
    return {
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-900',
      borderColor: 'border-slate-200'
    }
  }
  const health = HEALTH_STATUS[status as HealthStatus]
  return {
    bgColor: health.bgColor,
    textColor: health.textColor,
    borderColor: health.borderColor
  }
}

export const HEALTH_FILTER_OPTIONS = [
  { value: 'EXCELENTE', label: 'Excelente', color: '#0ea5e9' },
  { value: 'BUENO', label: 'Bueno', color: '#16a34a' },
  { value: 'REGULAR', label: 'Regular', color: '#f59e0b' },
  { value: 'MALO', label: 'Malo', color: '#f97316' },
  { value: 'CRITICO', label: 'Crítico', color: '#dc2626' }
] as const

export const SURVIVAL_STATUS_MULTIPLIERS = {
  EXCELENTE: 0.96,
  BUENO: 0.92,
  REGULAR: 0.84,
  MALO: 0.70,
  CRITICO: 0.50
} as const

const SURVIVAL_STATUS_BOUNDS = {
  EXCELENTE: { min: 70, max: 100 },
  BUENO: { min: 60, max: 89 },
  REGULAR: { min: 45, max: 79 },
  MALO: { min: 20, max: 59 },
  CRITICO: { min: 0, max: 39 }
} as const

function getSeedOffset(value?: string | number): number {
  if (value === undefined || value === null) {
    return 0
  }

  const seed = typeof value === "number"
    ? value
    : String(value).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return (seed % 7) - 3
}

export function getCoherentSurvivalScore(
  status?: string,
  baseScore?: number,
  treeId?: string | number
): number | null {
  if (baseScore === undefined || baseScore === null) {
    return null
  }

  const multiplier = status && status in SURVIVAL_STATUS_MULTIPLIERS
    ? SURVIVAL_STATUS_MULTIPLIERS[status as HealthStatus]
    : 1

  const adjusted = Math.round(baseScore * multiplier) + getSeedOffset(treeId)

  if (status && status in SURVIVAL_STATUS_BOUNDS) {
    const range = SURVIVAL_STATUS_BOUNDS[status as HealthStatus]
    return Math.max(range.min, Math.min(range.max, adjusted))
  }

  return Math.max(0, Math.min(100, adjusted))
}
