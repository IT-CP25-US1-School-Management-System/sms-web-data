export const THAI_LOCALE = 'th-TH'
export const THAI_BUDDHIST_LOCALE = 'th-TH-u-ca-buddhist'
export const THAI_GREGORIAN_LOCALE = 'th-TH-u-ca-gregory'
export const THAI_TIME_ZONE = 'Asia/Bangkok'

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/

function toDisplayDate(date: string | Date): Date {
  if (typeof date === 'string') {
    const parts = date.match(DATE_ONLY_PATTERN)
    if (parts) {
      const [, year, month, day] = parts
      return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12))
    }
  }

  return new Date(date)
}

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime())
}

export const formatThaiBuddhistDate = (date?: string | Date | null): string => {
  if (!date) return ''
  const d = toDisplayDate(date)
  if (!isValidDate(d)) return ''

  return new Intl.DateTimeFormat(THAI_BUDDHIST_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: THAI_TIME_ZONE,
  }).format(d)
}

export const formatThaiBuddhistDateRange = (dateRange?: string | null): string => {
  if (!dateRange) return ''

  const [startDate = '', endDate = ''] = dateRange.split('~')
  const start = formatThaiBuddhistDate(startDate)
  const end = formatThaiBuddhistDate(endDate)

  if (!start) return ''
  if (!end || start === end) return start
  return `${start} - ${end}`
}

export const formatThaiBuddhistDateTime = (date?: string | Date | null): string => {
  if (!date) return ''
  const d = toDisplayDate(date)
  if (!isValidDate(d)) return ''

  return new Intl.DateTimeFormat(THAI_BUDDHIST_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: THAI_TIME_ZONE,
  }).format(d)
}

export const formatDate = (date: string | Date): string => formatThaiBuddhistDate(date)

export const formatDateTime = (date: string | Date): string => formatThaiBuddhistDateTime(date)

export const formatDateInput = (date?: string | Date | null): string => {
  if (!date) return ''
  if (typeof date === 'string') {
    return date.split('T')[0] || ''
  }

  const isoString = date.toISOString()
  return isoString.split('T')[0] || ''
}

export const formatTime = (date: string | Date): string => {
  const d = new Date(date)
  if (!isValidDate(d)) return ''

  return new Intl.DateTimeFormat(THAI_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: THAI_TIME_ZONE,
  }).format(d)
}

export const formatDateThaiInput = (date?: string | Date | null): string => {
  return formatThaiBuddhistDate(date)
}

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('th-TH').format(price)
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function sortDropdownOptionsByThaiLabel<T extends { label: string }>(options: T[]): T[] {
  return [...options].sort((left, right) =>
    left.label.localeCompare(right.label, 'th-TH', {
      numeric: true,
      sensitivity: 'base',
    }),
  )
}

export const toDateInputFormat = (date: string | Date | undefined | null): string => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const getImgInitials = (name: string) => {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const PREFIX_NAME_BY_ID: Record<string, string> = {
  '250ae8ee-9f0a-4b94-a2c4-a475752dc3e6': 'นาย',
  '6ec2c1dd-ab31-47d3-8870-680baac1b8da': 'นาง',
  '9b91d6d5-c414-4a92-b44a-2ad07250271c': 'นางสาว',
}

export const PREFIX_ID_BY_NAME = Object.fromEntries(
  Object.entries(PREFIX_NAME_BY_ID).map(([id, name]) => [name, id]),
) as Record<string, string>

export const getPrefixName = (prefixId?: number | string | null): string => {
  const prefixMap: Record<number | string, string> = {
    '250ae8ee-9f0a-4b94-a2c4-a475752dc3e6': 'นาย',
    '6ec2c1dd-ab31-47d3-8870-680baac1b8da': 'นาง',
    '9b91d6d5-c414-4a92-b44a-2ad07250271c': 'นางสาว',
  }
  if (!prefixId) return ''
  return prefixMap[prefixId] || ''
}

export const getPrefixId = (prefixValue?: number | string | null): string => {
  if (!prefixValue) return ''

  const normalizedValue = String(prefixValue).trim()
  if (!normalizedValue) return ''

  return PREFIX_ID_BY_NAME[normalizedValue] || normalizedValue
}

export const calAge = (birthDate: string | Date): number => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}
