import * as XLSX from 'xlsx'
import { tsToDate } from './format'

export const exportToExcel = (rows, filename = 'export.xlsx', sheetName = 'Data') => {
  const ws = XLSX.utils.json_to_sheet(rows)
  const cols = Object.keys(rows[0] || {}).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...rows.map((r) => String(r[key] ?? '').length).slice(0, 100)
    )
    return { wch: Math.min(Math.max(maxLen + 2, 10), 50) }
  })
  ws['!cols'] = cols
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

export const leadsToExcelRows = (leads) => leads.map((l) => ({
  'Lead Code': l.leadCode || '',
  'Title': l.title || '',
  'Type': l.leadType || '',
  'Stage': l.stage || '',
  'Priority': l.priority || '',
  'Estimated Value': l.estimatedValue || 0,
  'Probability %': l.probability || 0,
  'Org Name': l.orgName || '',
  'Contact Person': l.contactPersonName || '',
  'Contact Phone': l.contactPhone || '',
  'Contact Email': l.contactEmail || '',
  'City': l.city || '',
  'State': l.state || '',
  'Pincode': l.pincode || '',
  'Owner': l.assignedToName || '',
  'Created By': l.createdByName || '',
  'Created At': tsToDate(l.createdAt)?.toLocaleString('en-IN') || '',
  'Updated At': tsToDate(l.updatedAt)?.toLocaleString('en-IN') || '',
  'Notes': l.notes || ''
}))

export const tendersToExcelRows = (tenders) => tenders.map((t) => ({
  'Tender Code': t.tenderCode || '',
  'Tender Number': t.tenderNumber || '',
  'Title': t.title || '',
  'Authority': t.authority === 'Other' ? t.authorityOther : t.authority,
  'Batch ID': t.batchId || '',
  'Status': t.status || '',
  'Win Probability %': t.winProbability || 0,
  'Estimated Value': t.estimatedValue || 0,
  'Quantity': t.quantity || 1,
  'Tender Fee': t.tenderFee || 0,
  'EMD Amount': t.emdAmount || 0,
  'EMD Validity (days)': t.emdValidityDays || 0,
  'EMD Refunded': t.emdRefunded ? 'Yes' : 'No',
  'PBG Amount': t.pbgAmount || 0,
  'SD Percent': t.sdPercent || 5,
  'Bid Submission Start': tsToDate(t.bidSubmissionStart)?.toLocaleString('en-IN') || '',
  'Submission Deadline': tsToDate(t.submissionDeadline)?.toLocaleString('en-IN') || '',
  'Pre-bid Meeting': tsToDate(t.preBidMeetingDate)?.toLocaleString('en-IN') || '',
  'Physical Submission Start': tsToDate(t.physicalSubmissionStart)?.toLocaleDateString('en-IN') || '',
  'Physical Submission End': tsToDate(t.physicalSubmissionEnd)?.toLocaleDateString('en-IN') || '',
  'Online Opening Date': tsToDate(t.onlineOpeningDate)?.toLocaleString('en-IN') || '',
  'Result Date': tsToDate(t.resultDate)?.toLocaleDateString('en-IN') || '',
  'Portal URL': t.portalUrl || '',
  'Contact Person': t.contactPerson || '',
  'Contact Phone': t.contactPhone || '',
  'Warranty Years': t.warrantyYears || '',
  'CMC Years': t.cmcYears || '',
  'Delivery Days': t.deliveryDays || '',
  'Items Count': (t.items || []).length,
  'Total Bid Value': (t.items || []).reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0),
  'Owner': t.assignedToName || '',
  'Notes': t.notes || ''
}))

export const importFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { raw: false })
        resolve(rows)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export const excelRowsToLeads = (rows) => rows.map((r) => ({
  title: r['Title'] || r['title'] || '',
  leadType: r['Type'] || r['leadType'] || 'HOSPITAL',
  stage: r['Stage'] || r['stage'] || 'NEW',
  priority: r['Priority'] || r['priority'] || 'WARM',
  estimatedValue: Number(r['Estimated Value'] || r['estimatedValue'] || 0),
  probability: Number(r['Probability %'] || r['probability'] || 50),
  orgName: r['Org Name'] || r['orgName'] || '',
  contactPersonName: r['Contact Person'] || r['contactPersonName'] || '',
  contactPhone: String(r['Contact Phone'] || r['contactPhone'] || ''),
  contactEmail: r['Contact Email'] || r['contactEmail'] || '',
  city: r['City'] || r['city'] || '',
  state: r['State'] || r['state'] || '',
  pincode: String(r['Pincode'] || r['pincode'] || ''),
  notes: r['Notes'] || r['notes'] || ''
}))

// Robust date parser for Indian govt tender Excels.
// Handles ALL of: Date objects, ISO (yyyy-mm-dd), Indian (dd-mm-yyyy), with optional times.
// CRITICAL: tries ISO and Indian regexes BEFORE native Date() because new Date("10-06-2026")
// is interpreted as October 6 in US format browsers (Chrome on Android).
const parseDate = (val) => {
  if (val === null || val === undefined || val === '') return null
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val
  const s = String(val).trim()
  if (!s) return null

  // 1. ISO format: yyyy-mm-dd or yyyy-mm-dd hh:mm or yyyy-mm-ddThh:mm
  //    SheetJS outputs this when cellDates:true + numFmt "yyyy-mm-dd".
  const iso = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[\sT](\d{1,2}):(\d{2}))?/)
  if (iso) {
    const [, yyyy, mm, dd, hh = '0', min = '0'] = iso
    const m = Number(mm), d = Number(dd)
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return new Date(Number(yyyy), m - 1, d, Number(hh), Number(min))
    }
  }

  // 2. Indian DD-MM-YYYY format: "10-06-2026" or "10-06-2026 18:00" or "10/06/2026"
  //    Standard for Indian govt tenders (GMSCL, Civil Hospital, GeM, etc.)
  const indian = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[\sT](\d{1,2}):(\d{2}))?/)
  if (indian) {
    const [, p1, p2, yyyy, hh = '0', min = '0'] = indian
    let dd = Number(p1), mm = Number(p2)
    // If month > 12 but day <= 12, the file used MM-DD-YYYY — swap
    if (mm > 12 && dd <= 12) { [dd, mm] = [mm, dd] }
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      return new Date(Number(yyyy), mm - 1, dd, Number(hh), Number(min))
    }
  }

  // 3. Last resort: native Date parser (handles RFC, Excel serial numbers, etc.)
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d

  return null
}

export const excelRowsToTenders = (rows) => rows.map((r) => {
  const get = (...keys) => {
    for (const k of keys) {
      if (r[k] !== undefined && r[k] !== null && r[k] !== '') return r[k]
    }
    return null
  }
  return {
    tenderNumber: String(get('Tender Number', 'tenderNumber', 'Tender ID', 'tender_id') || ''),
    title: String(get('Title', 'title', 'Equipment / Item', 'Equipment') || ''),
    authority: String(get('Authority', 'authority') || 'Other'),
    authorityOther: String(get('Authority Other', 'authorityOther') || ''),
    batchId: String(get('Batch ID', 'batchId', 'Batch') || ''),
    status: String(get('Status', 'status') || 'DRAFT'),
    winProbability: Number(get('Win Probability %', 'winProbability') || 50),
    estimatedValue: Number(get('Estimated Value', 'estimatedValue', 'Estimated Value (Rs.)') || 0),
    quantity: Number(get('Quantity', 'quantity') || 1),
    tenderFee: Number(get('Tender Fee', 'tenderFee', 'Tender Fee (Rs.)') || 0),
    emdAmount: Number(get('EMD Amount', 'emdAmount', 'EMD (Rs.)', 'EMD') || 0),
    emdValidityDays: Number(get('EMD Validity (days)', 'emdValidityDays') || 0),
    emdRefunded: String(get('EMD Refunded', 'emdRefunded') || '').toLowerCase() === 'yes',
    pbgAmount: Number(get('PBG Amount', 'pbgAmount') || 0),
    sdPercent: Number(get('SD Percent', 'sdPercent') || 5),
    bidSubmissionStart: parseDate(get('Bid Submission Start', 'bidSubmissionStart')),
    submissionDeadline: parseDate(get('Submission Deadline', 'submissionDeadline', 'Bid Submission End')),
    preBidMeetingDate: parseDate(get('Pre-bid Meeting', 'preBidMeetingDate')),
    physicalSubmissionStart: parseDate(get('Physical Submission Start', 'physicalSubmissionStart')),
    physicalSubmissionEnd: parseDate(get('Physical Submission End', 'physicalSubmissionEnd')),
    onlineOpeningDate: parseDate(get('Online Opening Date', 'onlineOpeningDate', 'Online Opening')),
    resultDate: parseDate(get('Result Date', 'resultDate')),
    portalUrl: String(get('Portal URL', 'portalUrl') || ''),
    contactPerson: String(get('Contact Person', 'contactPerson') || ''),
    contactPhone: String(get('Contact Phone', 'contactPhone') || ''),
    warrantyYears: Number(get('Warranty Years', 'warrantyYears') || 0) || null,
    cmcYears: Number(get('CMC Years', 'cmcYears') || 0) || null,
    deliveryDays: Number(get('Delivery Days', 'deliveryDays') || 0) || null,
    notes: String(get('Notes', 'notes') || '')
  }
})
