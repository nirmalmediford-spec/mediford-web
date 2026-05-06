// Mirrors the Roles object in the Android app's Models.kt.
// Keep this in sync with the Android code so behavior matches.

export const Roles = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SALES: 'SALES',
  TELECALLER: 'TELECALLER',
  TENDER_MANAGER: 'TENDER_MANAGER',
  TENDER_EXECUTIVE: 'TENDER_EXECUTIVE'
}

export const ALL_ROLES = Object.values(Roles)

const SALES_TEAM = new Set([Roles.ADMIN, Roles.MANAGER, Roles.SALES, Roles.TELECALLER])
const TENDER_TEAM = new Set([Roles.ADMIN, Roles.MANAGER, Roles.TENDER_MANAGER, Roles.TENDER_EXECUTIVE])

export const canSeeLeads = (role) => SALES_TEAM.has(role)
export const canSeeTenders = (role) => TENDER_TEAM.has(role)
export const canManageTeam = (role) => role === Roles.ADMIN
export const canSeeBothDashboards = (role) => role === Roles.ADMIN || role === Roles.MANAGER

export const roleLabel = (role) => ({
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SALES: 'Sales',
  TELECALLER: 'Telecaller',
  TENDER_MANAGER: 'Tender Manager',
  TENDER_EXECUTIVE: 'Tender Executive'
}[role] || role)

export const LeadStage = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  QUOTE_SENT: 'QUOTE_SENT',
  NEGOTIATION: 'NEGOTIATION',
  SITE_VISIT: 'SITE_VISIT',
  PO_RECEIVED: 'PO_RECEIVED',
  PAYMENT_DONE: 'PAYMENT_DONE',
  LOST: 'LOST'
}

export const ALL_LEAD_STAGES = Object.values(LeadStage)

export const stageLabel = (stage) => ({
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  QUOTE_SENT: 'Quote Sent',
  NEGOTIATION: 'Negotiation',
  SITE_VISIT: 'Site Visit',
  PO_RECEIVED: 'PO Received',
  PAYMENT_DONE: 'Payment Done 🏆',
  LOST: 'Lost'
}[stage] || stage)

export const stageColor = (stage) => ({
  NEW: '#94A3B8',
  CONTACTED: '#185FA5',
  QUALIFIED: '#0EA5E9',
  QUOTE_SENT: '#7C3AED',
  NEGOTIATION: '#A855F7',
  SITE_VISIT: '#EAB308',
  PO_RECEIVED: '#16A34A',
  PAYMENT_DONE: '#15803D',
  LOST: '#DC2626'
}[stage] || '#64748B')

export const Priority = {
  HOT: 'HOT',
  WARM: 'WARM',
  COLD: 'COLD'
}

export const priorityColor = (p) => ({
  HOT: '#DC2626',
  WARM: '#EAB308',
  COLD: '#0EA5E9'
}[p] || '#94A3B8')

export const TenderStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  PENDING_RESULT: 'PENDING_RESULT',
  WON: 'WON',
  LOST: 'LOST',
  CANCELLED: 'CANCELLED'
}

export const ALL_TENDER_STATUS = Object.values(TenderStatus)

export const tenderStatusLabel = (s) => ({
  DRAFT: 'Draft (preparing)',
  SUBMITTED: 'Submitted',
  PENDING_RESULT: 'Awaiting Result',
  WON: 'Won 🏆',
  LOST: 'Lost',
  CANCELLED: 'Cancelled'
}[s] || s)

export const tenderStatusColor = (s) => ({
  DRAFT: '#94A3B8',
  SUBMITTED: '#185FA5',
  PENDING_RESULT: '#EF9F27',
  WON: '#16A34A',
  LOST: '#DC2626',
  CANCELLED: '#64748B'
}[s] || '#94A3B8')

export const TenderAuthorities = [
  'GMSCL', 'CGHS', 'GeM', 'ESIC', 'RMSCL', 'TNMSC', 'HLL Lifecare', 'AIIMS',
  'Railway Hospital', 'Defence (DGAFMS)', 'State Health Dept',
  'Private Hospital Tender', 'Other'
]
