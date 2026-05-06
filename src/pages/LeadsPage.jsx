import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, Stack, Button, TextField, MenuItem, Chip, IconButton,
  Typography, Tooltip, Snackbar, Alert
} from '@mui/material'
import {
  DataGrid
} from '@mui/x-data-grid'
import {
  Add, Search, FileDownload, FileUpload, Print, FilterList, WhatsApp, Phone
} from '@mui/icons-material'
import { useCollection, createDoc, generateCode } from '../utils/firestoreHooks'
import { useAuth } from '../contexts/AuthContext'
import {
  ALL_LEAD_STAGES, stageLabel, stageColor, Priority, priorityColor
} from '../utils/models'
import { formatINR, formatINRFull, tsToDate, relativeTime } from '../utils/format'
import { exportToExcel, leadsToExcelRows, importFromExcel, excelRowsToLeads } from '../utils/excel'
import { generateLeadsReport } from '../utils/pdf'

export default function LeadsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const { data: leads, loading } = useCollection('leads', { orderBy: ['createdAt', 'desc'] })
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [ownerFilter, setOwnerFilter] = useState('ALL')
  const [snackbar, setSnackbar] = useState(null)

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (stageFilter !== 'ALL' && l.stage !== stageFilter) return false
      if (priorityFilter !== 'ALL' && l.priority !== priorityFilter) return false
      if (ownerFilter === 'MINE' && l.assignedTo !== user.uid) return false
      if (search) {
        const s = search.toLowerCase()
        const haystack = [l.title, l.leadCode, l.orgName, l.contactPersonName, l.contactPhone, l.city]
          .filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(s)) return false
      }
      return true
    })
  }, [leads, search, stageFilter, priorityFilter, ownerFilter, user.uid])

  const handleExport = () => {
    if (filtered.length === 0) {
      setSnackbar({ severity: 'warning', msg: 'No leads to export' })
      return
    }
    exportToExcel(leadsToExcelRows(filtered), `mediford-leads-${new Date().toISOString().split('T')[0]}.xlsx`)
    setSnackbar({ severity: 'success', msg: `Exported ${filtered.length} leads` })
  }

  const handlePrint = () => {
    if (filtered.length === 0) {
      setSnackbar({ severity: 'warning', msg: 'No leads to print' })
      return
    }
    generateLeadsReport(filtered, { subtitle: `Filtered: ${filtered.length} of ${leads.length} leads` })
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const rows = await importFromExcel(file)
      const leadsToCreate = excelRowsToLeads(rows)
      let created = 0
      for (const lead of leadsToCreate) {
        if (!lead.title && !lead.orgName) continue
        const code = await generateCode('leads', 'LEAD')
        await createDoc('leads', {
          ...lead,
          leadCode: code,
          assignedTo: user.uid,
          assignedToName: user.name,
          createdBy: user.uid,
          createdByName: user.name
        })
        created++
      }
      setSnackbar({ severity: 'success', msg: `Imported ${created} leads from Excel!` })
    } catch (err) {
      console.error(err)
      setSnackbar({ severity: 'error', msg: `Import failed: ${err.message}` })
    } finally {
      e.target.value = ''
    }
  }

  const columns = [
    {
      field: 'leadCode', headerName: 'Code', width: 130,
      renderCell: (p) => <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{p.value}</Typography>
    },
    {
      field: 'title', headerName: 'Title', flex: 1, minWidth: 200,
      renderCell: (p) => (
        <Box>
          <Typography sx={{ fontWeight: 500, fontSize: 14 }}>{p.value || '-'}</Typography>
          <Typography variant="caption" color="text.secondary">{p.row.orgName}</Typography>
        </Box>
      )
    },
    {
      field: 'stage', headerName: 'Stage', width: 130,
      renderCell: (p) => (
        <Chip
          size="small" label={stageLabel(p.value)}
          sx={{ bgcolor: `${stageColor(p.value)}20`, color: stageColor(p.value), fontWeight: 500 }}
        />
      )
    },
    {
      field: 'priority', headerName: 'Priority', width: 100,
      renderCell: (p) => (
        <Chip
          size="small" label={p.value || ''}
          sx={{ bgcolor: `${priorityColor(p.value)}20`, color: priorityColor(p.value), fontWeight: 500 }}
        />
      )
    },
    {
      field: 'estimatedValue', headerName: 'Value', width: 120,
      align: 'right', headerAlign: 'right',
      renderCell: (p) => <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{formatINR(p.value || 0)}</Typography>
    },
    {
      field: 'contactPersonName', headerName: 'Contact', width: 170,
      renderCell: (p) => (
        <Box>
          <Typography sx={{ fontSize: 13 }}>{p.value || '-'}</Typography>
          <Typography variant="caption" color="text.secondary">{p.row.contactPhone}</Typography>
        </Box>
      )
    },
    { field: 'assignedToName', headerName: 'Owner', width: 130 },
    {
      field: 'createdAt', headerName: 'Created', width: 130,
      valueGetter: (value) => tsToDate(value),
      renderCell: (p) => (
        <Typography variant="caption" color="text.secondary">
          {p.value ? relativeTime(p.value) : '-'}
        </Typography>
      )
    },
    {
      field: 'actions', headerName: 'Actions', width: 110, sortable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          {p.row.contactPhone && (
            <>
              <Tooltip title="Call"><IconButton
                size="small" component="a" href={`tel:${p.row.contactPhone}`}
                onClick={(e) => e.stopPropagation()}
              ><Phone fontSize="small" sx={{ color: '#1D9E75' }} /></IconButton></Tooltip>
              <Tooltip title="WhatsApp"><IconButton
                size="small" component="a"
                href={`https://wa.me/${String(p.row.contactPhone).replace(/\D/g, '')}`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
              ><WhatsApp fontSize="small" sx={{ color: '#25D366' }} /></IconButton></Tooltip>
            </>
          )}
        </Stack>
      )
    }
  ]

  return (
    <Box>
      {/* Toolbar */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <TextField
            size="small" placeholder="Search by code, title, org, contact, city..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ minWidth: { md: 280 }, flex: 1 }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <TextField
              size="small" select label="Stage" value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)} sx={{ minWidth: 130 }}
            >
              <MenuItem value="ALL">All stages</MenuItem>
              {ALL_LEAD_STAGES.map(s => <MenuItem key={s} value={s}>{stageLabel(s)}</MenuItem>)}
            </TextField>
            <TextField
              size="small" select label="Priority" value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)} sx={{ minWidth: 110 }}
            >
              <MenuItem value="ALL">All</MenuItem>
              {Object.values(Priority).map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
            <TextField
              size="small" select label="Owner" value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)} sx={{ minWidth: 110 }}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="MINE">My Leads</MenuItem>
            </TextField>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/leads/new')}>
            New Lead
          </Button>
          <Button variant="outlined" startIcon={<FileDownload />} onClick={handleExport}>
            Export Excel
          </Button>
          <Button variant="outlined" startIcon={<FileUpload />} onClick={() => fileInputRef.current?.click()}>
            Import Excel
          </Button>
          <input
            type="file" ref={fileInputRef} hidden
            accept=".xlsx,.xls,.csv"
            onChange={handleImport}
          />
          <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>
            PDF Report
          </Button>
          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
            {filtered.length} of {leads.length} leads
            {filtered.length > 0 && ` • Pipeline: ${formatINRFull(filtered.reduce((s, l) => s + (l.estimatedValue || 0), 0))}`}
          </Typography>
        </Stack>
      </Card>

      {/* DataGrid */}
      <Card>
        <DataGrid
          rows={filtered}
          columns={columns}
          loading={loading}
          autoHeight
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          onRowClick={(p) => navigate(`/leads/${p.id}`)}
          sx={{
            border: 'none',
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#FAF7FE', fontWeight: 600 }
          }}
        />
      </Card>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
      >
        {snackbar && <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)}>{snackbar.msg}</Alert>}
      </Snackbar>
    </Box>
  )
}
