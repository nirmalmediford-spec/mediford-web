import { format, formatDistanceToNow, differenceInDays, isThisMonth as isInThisMonth } from 'date-fns'

export const formatINR = (amount) => {
  const n = Number(amount) || 0
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toFixed(0)}`
}

export const formatINRFull = (amount) => {
  const n = Number(amount) || 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(n)
}

export const tsToDate = (timestamp) => {
  if (!timestamp) return null
  if (timestamp.toDate) return timestamp.toDate() // Firestore Timestamp
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000)
  if (timestamp instanceof Date) return timestamp
  return null
}

export const formatDate = (timestamp, fmt = 'dd MMM yyyy') => {
  const date = tsToDate(timestamp)
  if (!date) return ''
  return format(date, fmt)
}

export const formatDateTime = (timestamp) => formatDate(timestamp, 'dd MMM yyyy, hh:mm a')

export const relativeTime = (timestamp) => {
  const date = tsToDate(timestamp)
  if (!date) return ''
  return formatDistanceToNow(date, { addSuffix: true })
}

export const daysUntil = (timestamp) => {
  const date = tsToDate(timestamp)
  if (!date) return null
  return differenceInDays(date, new Date())
}

export const isThisMonth = (timestamp) => {
  const date = tsToDate(timestamp)
  if (!date) return false
  return isInThisMonth(date)
}

export const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const initials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}
