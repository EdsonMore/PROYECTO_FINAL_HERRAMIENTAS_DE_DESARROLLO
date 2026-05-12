export const HEALTH_STATUS = {
  excelente: {
    color: '#22c55e',
    emoji: '🟢',
    label: 'Excelente',
    bgColor: 'bg-green-50',
    textColor: 'text-green-900',
    borderColor: 'border-green-200'
  },
  regular: {
    color: '#eab308',
    emoji: '🟡',
    label: 'Regular',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-900',
    borderColor: 'border-yellow-200'
  },
  malo: {
    color: '#ef4444',
    emoji: '🔴',
    label: 'Crítico',
    bgColor: 'bg-red-50',
    textColor: 'text-red-900',
    borderColor: 'border-red-200'
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
  { value: 'excelente', label: 'Excelente', color: '#22c55e' },
  { value: 'regular', label: 'Regular', color: '#eab308' },
  { value: 'malo', label: 'Crítico', color: '#ef4444' }
] as const
