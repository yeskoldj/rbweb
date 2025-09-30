const DATE_ONLY_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/

const safeParseDate = (rawDate?: string | null): Date | null => {
  const value = (rawDate || '').trim()
  if (!value) return null

  if (!DATE_ONLY_ISO_REGEX.test(value)) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const formatPickupDate = (rawDate?: string | null, locale = 'es-ES') => {
  const parsed = safeParseDate(rawDate)
  if (!parsed) {
    const fallback = (rawDate || '').trim()
    return fallback || null
  }

  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(parsed)
  } catch {
    return parsed.toISOString().split('T')[0]
  }
}

export const formatPickupDetails = (
  rawDate?: string | null,
  rawTime?: string | null,
  locale = 'es-ES'
) => {
  const dateLabel = formatPickupDate(rawDate, locale)
  const timeValue = (rawTime || '').trim()

  if (dateLabel && timeValue) {
    const connector = locale.startsWith('es') ? 'a las' : 'at'
    return `${dateLabel} ${connector} ${timeValue}`
  }

  if (timeValue) {
    return timeValue
  }

  return dateLabel || ''
}
