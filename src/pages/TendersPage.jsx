import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, Stack, Button, TextField, MenuItem, Chip, Typography, Snackbar, Alert
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Add, Search, FileDownload, FileUpload, Print } from '@mui/icons-material'
import { useCollection, createDoc, generateCode } from '../utils/firestoreHooks'
import { useAuth } from '../contexts/AuthContext'
import {
  ALL_TENDER_STATUS, tenderStatusLabel, tenderStatusColor, TenderAuthorities
} from '../utils/models'
import { formatINR, formatINRFull, daysUntil, formatDate, tsToDate } from '../utils/format'
import { exportToExcel, tendersToExcelRows, importFromExcel, excelRowsToTenders } from '../utils/excel'
import { generateTendersReport } from '../utils/pdf'
import { addSubdoc } from '../utils/firestoreHooks'
import { Timestamp } from 'firebase/firestore'

export default function TendersPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const { data: tenders, loading } = useCollection('tenders', { orderBy: ['createdAt', 'desc'] })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [authorityFilter, setAuthorityFilter] = useState('ALL')
  const [batchFilter, setBatchFilter] = useState('ALL')
  const [snackbar, setSnackbar] = useState(null)
  const [importing, setImporting] = useState(false)

  // Compute unique batch IDs from tenders for the filter
  const allBatches = useMemo(() => {
    const set = new Set(tenders.map(t => t.batchId).filter(Boolean))
    return Array.from(set).sort()
  }, [tenders])

  const filtered = useMemo(() => tenders.filter(t => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false
    if (authorityFilter !== 'ALL' && t.authority !== authorityFilter) return false
    if (batchFilter !== 'ALL' && t.batchId !== batchFilter) return false
    if (search) {
      const s = search.toLowerCase()
      const haystack = [t.title, t.tenderCode, t.tenderNumber, t.authority, t.authorityOther, t.batchId]
        .filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(s)) return false
    }
    return true
  }), [tenders, search, statusFilter, authorityFilter, batchFilter])

  const handleExport = () => {
    if (filtered.length === 0) { setSnackbar({ severity: 'warning', msg: 'No tenders to export' }); return }
    exportToExcel(tendersToExcelRows(filtered), `mediford-tenders-${new Date().toISOString().split('T')[0]}.xlsx`)
    setSnackbar({ severity: 'success', msg: `Exported ${filtered.length} tenders` })
  }

  const handlePrint = () => {
    if (filtered.length === 0) { setSnackbar({ severity: 'warning', msg: 'No tenders to print' }); return }
    generateTendersReport(filtered, { subtitle: `Filtered: ${filtered.length} of ${tenders.length} tenders` })
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const rows = await importFromExcel(file)
      const tendersToCreate = excelRowsToTenders(rows)
      let created = 0
      for (const t of tendersToCreate) {
        if (!t.title && !t.tenderNumber) continue
        const code = await generateCode('tenders', 'TND')
        // Convert JS Dates to Firestore Timestamps
        const payload = { ...t, tenderCode: code }
        const dateFields = ['bidSubmissionStart', 'submissionDeadline', 'preBidMeetingDate',
          'physicalSubmissionStart', 'physicalSubmissionEnd', 'onlineOpeningDate', 'resultDate']
        for (const f of dateFields) {
          if (payload[f] instanceof Date && !isNaN(payload[f].getTime())) {
            payload[f] = Timestamp.fromDate(payload[f])
          } else {
            payload[f] = null
          }
        }
        // Strip undefined fields (Firestore rejects them)
        Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])
        payload.assignedTo = user.uid
        payload.assignedToName = user.name
        payload.assignedAt = new Date()
        payload.createdBy = user.uid
        payload.createdByName = user.name
        payload.items = []
        payload.competitors = []

        const ref = await createDoc('tenders', payload)
        await addSubdoc('tenders', ref.id, 'activities', {
          type: 'TENDER_CREATED',
          notes: `Tender imported from Excel${payload.batchId ? ` (Batch: ${payload.batchId})` : ''}`,
          authorUid: user.uid, authorName: user.name
        })
        created++
      }
      setSnackbar({ severity: 'success', msg: `Imported ${created} tenders from Excel!` })
    } catch (err) {
      console.error(err)
      setSnackbar({ severity: 'error', msg: `Import failed: ${err.message}` })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const columns = [
    {
      field: 'tenderCode', headerName: 'Code', width: 130,
      renderCell: (p) => <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{p.value}</Typography>
    },
    {
      field: 'title', headerName: 'Title / Number', flex: 1, minWidth: 220,
      renderCell: (p) => (
        <Box>
          <Typography sx={{ fontWeight: 500, fontSize: 14 }}>{p.value || p.row.tenderNumber || '-'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {p.row.tenderNumber}
            {p.row.batchId && ` • ${p.row.batchId}`}
          </Typography>
        </Box>
      )
    },
    {
      field: 'authority', headerName: 'Authority', width: 160,
      valueGetter: (value, row) => row.authority === 'Other' ? row.authorityOther : row.authority
    },
    {
      field: 'status', headerName: 'Status', width: 140,
      renderCell: (p) => (
        <Chip
          size="small" label={tenderStatusLabel(p.value)}
          sx={{ bgcolor: `${tenderStatusColor(p.value)}20`, color: tenderStatusColor(p.value), fontWeight: 500 }}
        />
      )
    },
    {
      field: 'submissionDeadline', headerName: 'Deadline', width: 170,
      valueGetter: (value) => tsToDate(value),
      renderCell: (p) => {
        if (!p.value) return <Typography variant="caption" color="text.secondary">-</Typography>
        const days = daysUntil(p.row.submissionDeadline)
        let color = '#94A3B8', label = formatDate(p.row.submissionDeadline)
        if (days < 0) { color = '#DC2626'; label = `❗ Passed ${-days}d ago` }
        else if (days === 0) { color = '#DC2626'; label = '🔥 TODAY' }
        else if (days <= 3) { color = '#DC2626'; label = `⏰ ${days}d left` }
        else if (days <= 7) { color = '#EF9F27'; label = `⏰ ${days}d left` }
        else label = `📅 ${days}d left`
        return <Typography sx={{ fontSize: 13, fontWeight: 500, color }}>{label}</Typography>
      }
    },
    {
      field: 'estimatedValue', headerName: 'Value', width: 120,
      align: 'right', headerAlign: 'right',
      renderCell: (p) => <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{formatINR(p.value || 0)}</Typography>
    },
    {
      field: 'emdAmount', headerName: 'EMD', width: 100,
      align: 'right', headerAlign: 'right',
      renderCell: (p) => <Typography sx={{ fontSize: 13 }}>{p.value ? formatINR(p.value) : '-'}</Typography>
    },
    {
      field: 'winProbability', headerName: 'Win %', width: 80,
      align: 'right', headerAlign: 'right',
      renderCell: (p) => <Typography sx={{ fontSize: 13 }}>{p.value || 50}%</Typography>
    },
    { field: 'assignedToName', headerName: 'Owner', width: 130 }
  ]

  return (
    <Box>
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <TextField
            size="small" placeholder="Search by code, title, number, authority, batch..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ minWidth: { md: 280 }, flex: 1 }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <TextField size="small" select label="Status" value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value="ALL">All statuses</MenuItem>
              {ALL_TENDER_STATUS.map(s => <MenuItem key={s} value={s}>{tenderStatusLabel(s)}</MenuItem>)}
            </TextField>
            <TextField size="small" select label="Authority" value={authorityFilter}
              onChange={(e) => setAuthorityFilter(e.target.value)} sx={{ minWidth: 160 }}>
              <MenuItem value="ALL">All</MenuItem>
              {TenderAuthorities.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
            {allBatches.length > 0 && (
              <TextField size="small" select label="Batch" value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)} sx={{ minWidth: 140 }}>
                <MenuItem value="ALL">All batches</MenuItem>
                {allBatches.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </TextField>
            )}
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/tenders/new')}>
            New Tender
          </Button>
          <Button variant="outlined" startIcon={<FileUpload />} onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? 'Importing...' : 'Import Excel'}
          </Button>
          <input
            type="file" ref={fileInputRef} hidden
            accept=".xlsx,.xls,.csv"
            onChange={handleImport}
          />
          <Button variant="outlined" startIcon={<FileDownload />} onClick={handleExport}>
            Export Excel
          </Button>
          <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>
            PDF Report
          </Button>
          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
            {filtered.length} of {tenders.length} tenders
            {filtered.length > 0 && ` • Total: ${formatINRFull(filtered.reduce((s, t) => s + (t.estimatedValue || 0), 0))}`}
          </Typography>
        </Stack>
      </Card>

      <Card>
        <DataGrid
          rows={filtered} columns={columns} loading={loading} autoHeight
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          onRowClick={(p) => navigate(`/tenders/${p.id}`)}
          sx={{
            border: 'none',
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#FAF7FE', fontWeight: 600 }
          }}
        />
      </Card>

      <Snackbar open={!!snackbar} autoHideDuration={5000} onClose={() => setSnackbar(null)}>
        {snackbar && <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)}>{snackbar.msg}</Alert>}
      </Snackbar>
    </Box>
  )
}
