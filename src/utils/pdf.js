import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatINRFull, tsToDate } from './format'
import { stageLabel, tenderStatusLabel } from './models'

const addHeader = (doc, title, subtitle) => {
  // Mediford branding bar
  doc.setFillColor(126, 95, 156)
  doc.rect(0, 0, 210, 24, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Mediford Inquiry', 14, 15)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleString('en-IN'), 196, 15, { align: 'right' })

  doc.setTextColor(40, 40, 40)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 35)
  if (subtitle) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    doc.text(subtitle, 14, 41)
    doc.setTextColor(40, 40, 40)
  }
  return subtitle ? 47 : 41
}

export const generateLeadsReport = (leads, options = {}) => {
  const doc = new jsPDF()
  const startY = addHeader(doc, 'Leads Pipeline Report',
    options.subtitle || `Total leads: ${leads.length}`)

  // Stats summary
  const totalValue = leads.reduce((s, l) => s + (l.estimatedValue || 0), 0)
  const wonValue = leads.filter(l => l.stage === 'PAYMENT_DONE').reduce((s, l) => s + (l.estimatedValue || 0), 0)
  const hotCount = leads.filter(l => l.priority === 'HOT').length

  doc.setFontSize(10)
  doc.text(`Pipeline value: ${formatINRFull(totalValue)}`, 14, startY + 5)
  doc.text(`Won value: ${formatINRFull(wonValue)}`, 14, startY + 11)
  doc.text(`Hot leads: ${hotCount}`, 14, startY + 17)

  autoTable(doc, {
    startY: startY + 24,
    head: [['Code', 'Title', 'Stage', 'Priority', 'Value', 'Owner', 'Org']],
    body: leads.map((l) => [
      l.leadCode || '',
      (l.title || '').slice(0, 30),
      stageLabel(l.stage),
      l.priority || '',
      formatINRFull(l.estimatedValue || 0),
      l.assignedToName || '',
      (l.orgName || '').slice(0, 20)
    ]),
    headStyles: { fillColor: [126, 95, 156], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 246, 252] }
  })

  doc.save(`mediford-leads-report-${new Date().toISOString().split('T')[0]}.pdf`)
}

export const generateTendersReport = (tenders, options = {}) => {
  const doc = new jsPDF()
  const startY = addHeader(doc, 'Tenders Report',
    options.subtitle || `Total tenders: ${tenders.length}`)

  const totalValue = tenders.reduce((s, t) => s + (t.estimatedValue || 0), 0)
  const wonValue = tenders.filter(t => t.status === 'WON').reduce((s, t) => s + (t.estimatedValue || 0), 0)
  const wonCount = tenders.filter(t => t.status === 'WON').length
  const lostCount = tenders.filter(t => t.status === 'LOST').length

  doc.setFontSize(10)
  doc.text(`Total value: ${formatINRFull(totalValue)}`, 14, startY + 5)
  doc.text(`Won: ${wonCount} (${formatINRFull(wonValue)})`, 14, startY + 11)
  doc.text(`Lost: ${lostCount}`, 14, startY + 17)

  autoTable(doc, {
    startY: startY + 24,
    head: [['Code', 'Title', 'Authority', 'Status', 'Deadline', 'Value', 'Owner']],
    body: tenders.map((t) => [
      t.tenderCode || '',
      (t.title || '').slice(0, 25),
      t.authority === 'Other' ? t.authorityOther : t.authority,
      tenderStatusLabel(t.status),
      tsToDate(t.submissionDeadline)?.toLocaleDateString('en-IN') || '',
      formatINRFull(t.estimatedValue || 0),
      t.assignedToName || ''
    ]),
    headStyles: { fillColor: [126, 95, 156], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 246, 252] }
  })

  doc.save(`mediford-tenders-report-${new Date().toISOString().split('T')[0]}.pdf`)
}

export const generateTeamPerformanceReport = (users, leads, tenders) => {
  const doc = new jsPDF()
  const startY = addHeader(doc, 'Team Performance Report',
    `As of ${new Date().toLocaleDateString('en-IN')}`)

  const rows = users.filter(u => u.active !== false).map((u) => {
    const myLeads = leads.filter(l => l.assignedTo === u.uid)
    const myActiveLeads = myLeads.filter(l => !['LOST', 'PAYMENT_DONE'].includes(l.stage))
    const myWonLeads = myLeads.filter(l => l.stage === 'PAYMENT_DONE')
    const myTenders = tenders.filter(t => t.assignedTo === u.uid)
    const myWonTenders = myTenders.filter(t => t.status === 'WON')
    return [
      u.name,
      u.role,
      myActiveLeads.length,
      myWonLeads.length,
      formatINRFull(myWonLeads.reduce((s, l) => s + (l.estimatedValue || 0), 0)),
      myTenders.filter(t => ['DRAFT', 'SUBMITTED', 'PENDING_RESULT'].includes(t.status)).length,
      myWonTenders.length,
      formatINRFull(myWonTenders.reduce((s, t) => s + (t.estimatedValue || 0), 0))
    ]
  })

  autoTable(doc, {
    startY: startY + 5,
    head: [['Name', 'Role', 'Active Leads', 'Won Leads', 'Won Value', 'Active Tenders', 'Won Tenders', 'Tender Won Value']],
    body: rows,
    headStyles: { fillColor: [126, 95, 156], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 246, 252] }
  })

  doc.save(`mediford-team-performance-${new Date().toISOString().split('T')[0]}.pdf`)
}
