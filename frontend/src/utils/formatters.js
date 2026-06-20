/**
 * Formatting utility functions for the ERP frontend.
 */

/**
 * Format currency in INR
 */
export const formatCurrency = (value, currency = 'INR') => {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format number with commas
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return new Intl.NumberFormat('en-IN').format(value)
}

/**
 * Format date to readable string
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

/**
 * Format datetime
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

/**
 * Truncate text
 */
export const truncate = (text, length = 50) => {
  if (!text) return '—'
  return text.length > length ? `${text.substring(0, length)}...` : text
}

/**
 * Convert enum key to label (e.g. RAW_MATERIAL → Raw Material)
 */
export const enumToLabel = (value) => {
  if (!value) return '—'
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Time ago relative format
 */
export const timeAgo = (dateStr) => {
  if (!dateStr) return '—'
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000)
  if (seconds < 60) return 'just now'
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ]
  for (const i of intervals) {
    const count = Math.floor(seconds / i.seconds)
    if (count >= 1) return `${count} ${i.label}${count > 1 ? 's' : ''} ago`
  }
  return 'just now'
}
