import * as XLSX from 'xlsx'
import { tsToDate } from './format'

export const exportToExcel = (rows, filename = 'export.xlsx', sheetName = 'Data') => {
  const ws = XLSX.utils.json_to_sheet(rows)
  // Auto-fit column widths
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
  'Status': t.status || '',
  'Win Probability %': t.winProbability || 0,
  'Estimated Value': t.estimatedValue || 0,
  'EMD Amount': t.emdAmount || 0,
  'EMD Validity (days)': t.emdValidityDays || 0,
  'EMD Refunded': t.emdRefunded ? 'Yes' : 'No',
  'PBG Amount': t.pbgAmount || 0,
  'Tender Date': tsToDate(t.tenderDate)?.toLocaleDateString('en-IN') || '',
  'Pre-bid Meeting': tsToDate(t.preBidMeetingDate)?.toLocaleString('en-IN') || '',
  'Submission Deadline': tsToDate(t.submissionDeadline)?.toLocaleString('en-IN') || '',
  'Result Date': tsToDate(t.resultDate)?.toLocaleDateString('en-IN') || '',
  'Items Count': (t.items || []).length,
  'Total Bid Value': (t.items || []).reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0),
  'Competitors': (t.competitors || []).map(c => c.name).join('; '),
  'Owner': t.assignedToName || '',
  'Outcome Notes': t.outcomeNotes || ''
}))

export const importFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws)
        resolve(rows)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// Map raw imported rows back to lead format
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
