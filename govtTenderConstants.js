// Constants for Indian government tender management.
// Based on standard nProcure / GMSCL / Civil Hospital tender patterns.

// ============================================================
// 31-DOCUMENT STANDARD CHECKLIST
// ============================================================
// Each tender gets these 31 items in /tenders/{id}/checklist subcollection.
// Status flow: NOT_STARTED → IN_PROGRESS → READY → SUBMITTED

export const CHECKLIST_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  READY: 'READY',
  SUBMITTED: 'SUBMITTED',
  NA: 'NA'  // not applicable for this tender
}

export const checklistStatusLabel = (s) => ({
  NOT_STARTED: '⚪ Not Started',
  IN_PROGRESS: '🟡 In Progress',
  READY: '🟢 Ready',
  SUBMITTED: '✅ Submitted',
  NA: '➖ N/A'
}[s] || s)

export const checklistStatusColor = (s) => ({
  NOT_STARTED: '#94A3B8',
  IN_PROGRESS: '#EAB308',
  READY: '#16A34A',
  SUBMITTED: '#15803D',
  NA: '#64748B'
}[s] || '#94A3B8')

// 31 documents grouped into 5 categories (A through E)
export const STANDARD_CHECKLIST = [
  // A. Eligibility & Compliance (10)
  { id: 1, group: 'A. Eligibility & Compliance', name: 'Bid Security / EMD payment proof', mandatory: true },
  { id: 2, group: 'A. Eligibility & Compliance', name: 'Tender Fee payment receipt', mandatory: true },
  { id: 3, group: 'A. Eligibility & Compliance', name: 'Authority Letter / Power of Attorney', mandatory: true },
  { id: 4, group: 'A. Eligibility & Compliance', name: "Bidder's Declaration & Compliance Statement", mandatory: true },
  { id: 5, group: 'A. Eligibility & Compliance', name: 'PAN Card copy', mandatory: true },
  { id: 6, group: 'A. Eligibility & Compliance', name: 'GST Registration certificate', mandatory: true },
  { id: 7, group: 'A. Eligibility & Compliance', name: 'Income Tax Returns (last 3 years)', mandatory: true },
  { id: 8, group: 'A. Eligibility & Compliance', name: 'Audited Balance Sheet (last 3 years)', mandatory: true },
  { id: 9, group: 'A. Eligibility & Compliance', name: 'CA Turnover Certificate (Annexure-VIII)', mandatory: true },
  { id: 10, group: 'A. Eligibility & Compliance', name: 'Bank Solvency Certificate', mandatory: false },

  // B. Manufacturer / Brand (5)
  { id: 11, group: 'B. Manufacturer / Brand', name: 'OEM / Manufacturer Authorization Letter', mandatory: true },
  { id: 12, group: 'B. Manufacturer / Brand', name: "Manufacturer's ISO 13485 certificate", mandatory: true },
  { id: 13, group: 'B. Manufacturer / Brand', name: "Manufacturer's CE Certificate (Euro CE)", mandatory: true },
  { id: 14, group: 'B. Manufacturer / Brand', name: 'USFDA 510(k) Approval', mandatory: true },
  { id: 15, group: 'B. Manufacturer / Brand', name: 'BIS / IS Certification', mandatory: true },

  // C. Regulatory & Quality (5)
  { id: 16, group: 'C. Regulatory & Quality', name: 'CDSCO Registration certificate', mandatory: true },
  { id: 17, group: 'C. Regulatory & Quality', name: 'AERB Type Approval (X-Ray / IITV only)', mandatory: false },
  { id: 18, group: 'C. Regulatory & Quality', name: 'ISO 9001 (Bidder)', mandatory: false },
  { id: 19, group: 'C. Regulatory & Quality', name: 'NABL Calibration Certificate', mandatory: false },
  { id: 20, group: 'C. Regulatory & Quality', name: 'Product Test Reports', mandatory: false },

  // D. Technical Bid (6)
  { id: 21, group: 'D. Technical Bid', name: 'Technical Specification Compliance Sheet', mandatory: true },
  { id: 22, group: 'D. Technical Bid', name: 'Product Brochure / Catalogue', mandatory: true },
  { id: 23, group: 'D. Technical Bid', name: 'User List / Past Supply Records', mandatory: true },
  { id: 24, group: 'D. Technical Bid', name: 'Performance Certificates (3 references)', mandatory: true },
  { id: 25, group: 'D. Technical Bid', name: 'Demo / Site Visit Confirmation Letter', mandatory: false },
  { id: 26, group: 'D. Technical Bid', name: 'Training Plan & Schedule', mandatory: true },

  // E. Commercial Bid (5)
  { id: 27, group: 'E. Commercial Bid', name: 'Price Bid (Annexure-I)', mandatory: true },
  { id: 28, group: 'E. Commercial Bid', name: 'CMC Price Bid (Annexure-X) — must be ≤ 9.99%/yr', mandatory: true },
  { id: 29, group: 'E. Commercial Bid', name: 'Spare Parts Price List (Annexure-XI)', mandatory: true },
  { id: 30, group: 'E. Commercial Bid', name: 'Warranty & Service Terms acceptance', mandatory: true },
  { id: 31, group: 'E. Commercial Bid', name: 'Bid validity declaration (180 days)', mandatory: true }
]

// ============================================================
// ANNEXURES I to XIII
// ============================================================
export const STANDARD_ANNEXURES = [
  { id: 'I',    name: 'Bid Form (Price Quotation)' },
  { id: 'II',   name: 'Bidder Details & Profile' },
  { id: 'III',  name: 'Authority Letter / Power of Attorney' },
  { id: 'IV',   name: 'Technical Specifications Compliance' },
  { id: 'V',    name: 'Past Supply / Performance Records' },
  { id: 'VI',   name: 'Manufacturer Authorization Letter' },
  { id: 'VII',  name: 'Bank Guarantee Format (EMD/PBG)' },
  { id: 'VIII', name: 'CA Turnover Certificate' },
  { id: 'IX',   name: 'No Litigation / Blacklisting Declaration' },
  { id: 'X',    name: 'CMC Pricing Schedule (≤ 9.99%/year)' },
  { id: 'XI',   name: 'Spare Parts List with Pricing' },
  { id: 'XII',  name: 'Training Schedule' },
  { id: 'XIII', name: 'Confidentiality / NDA Agreement' }
]

// ============================================================
// REGULATORY APPROVALS
// ============================================================
export const REGULATORY_APPROVALS = [
  { id: 'CDSCO',   name: 'CDSCO Registration',          required: 'All medical devices in India',  type: 'Indian' },
  { id: 'BIS',     name: 'BIS / IS Certification',      required: 'Electrical/electronic equipment', type: 'Indian' },
  { id: 'USFDA',   name: 'USFDA 510(k) Approval',       required: 'Imported high-end imaging',       type: 'International' },
  { id: 'CE',      name: 'Euro CE Marking',             required: 'EU-imported medical devices',    type: 'International' },
  { id: 'AERB',    name: 'AERB Type Approval',          required: 'X-Ray, IITV, Linear Accelerator', type: 'Indian (Radiation)' },
  { id: 'ISO13485',name: 'ISO 13485 (Quality System)',  required: 'Medical device manufacturers',    type: 'International' },
  { id: 'ISO9001', name: 'ISO 9001 (Bidder)',           required: 'General quality system',          type: 'International' }
]

export const REGULATORY_STATUS = {
  NA: 'NA',                      // not required for this tender
  REQUIRED: 'REQUIRED',          // required but not yet sourced
  APPLIED: 'APPLIED',            // applied for, awaiting cert
  AVAILABLE: 'AVAILABLE',        // certificate available
  SUBMITTED: 'SUBMITTED'         // submitted with bid
}

export const regulatoryStatusLabel = (s) => ({
  NA: 'Not Required',
  REQUIRED: '🔴 Required (Pending)',
  APPLIED: '🟡 Applied',
  AVAILABLE: '🟢 Available',
  SUBMITTED: '✅ Submitted'
}[s] || s)

export const regulatoryStatusColor = (s) => ({
  NA: '#94A3B8',
  REQUIRED: '#DC2626',
  APPLIED: '#EAB308',
  AVAILABLE: '#16A34A',
  SUBMITTED: '#15803D'
}[s] || '#94A3B8')

// ============================================================
// PAYMENT TYPES (multi-stage money tracking)
// ============================================================
export const PAYMENT_TYPES = [
  { id: 'TENDER_FEE', name: 'Tender Fee',         refundable: false, stage: 'Pre-bid' },
  { id: 'EMD',        name: 'Earnest Money Deposit (EMD)', refundable: true, stage: 'Pre-bid' },
  { id: 'SD',         name: 'Security Deposit (5%)', refundable: true, stage: 'Post-award' },
  { id: 'PBG',        name: 'Performance Bank Guarantee', refundable: true, stage: 'Post-award' }
]

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
  FORFEITED: 'FORFEITED',
  NA: 'NA'
}

export const paymentStatusLabel = (s) => ({
  PENDING: '⏳ Pending',
  PAID: '✅ Paid',
  REFUNDED: '↩️ Refunded',
  FORFEITED: '❌ Forfeited',
  NA: '➖ N/A'
}[s] || s)

export const paymentStatusColor = (s) => ({
  PENDING: '#EAB308',
  PAID: '#185FA5',
  REFUNDED: '#16A34A',
  FORFEITED: '#DC2626',
  NA: '#94A3B8'
}[s] || '#94A3B8')

// ============================================================
// TIMELINE STAGES (for visual timeline)
// ============================================================
export const TIMELINE_STAGES = [
  { key: 'bidSubmissionStart',     label: 'Bid Open',         hasTime: true },
  { key: 'preBidMeetingDate',      label: 'Pre-bid Meeting',  hasTime: true },
  { key: 'submissionDeadline',     label: 'Submission Deadline', hasTime: true, milestone: true },
  { key: 'physicalSubmissionStart',label: 'Physical Window Opens', hasTime: false },
  { key: 'physicalSubmissionEnd',  label: 'Physical Window Closes', hasTime: false },
  { key: 'onlineOpeningDate',      label: 'Online Opening',   hasTime: true, milestone: true },
  { key: 'resultDate',             label: 'Result Declared',  hasTime: false, milestone: true }
]

// ============================================================
// CMC CAP — government rule
// ============================================================
export const CMC_ANNUAL_CAP_PERCENT = 9.99
