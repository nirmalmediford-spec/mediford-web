import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Stack, Chip, Avatar, Button, IconButton,
  TextField, Grid, MenuItem, Snackbar, Alert
} from '@mui/material'
import { ArrowBack, Save, Send } from '@mui/icons-material'
import {
  useDoc, useSubcollection, addSubdoc, updateDocById, useCollection, createDoc, generateCode
} from '../utils/firestoreHooks'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import {
  ALL_TENDER_STATUS, tenderStatusLabel, tenderStatusColor, TenderAuthorities,
  canSeeTenders, roleLabel
} from '../utils/models'
import { formatINRFull, daysUntil, formatDateTime, formatDate, relativeTime, initials } from '../utils/format'

export default function TenderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isNew = id === 'new'
  const { data: tender, loading } = useDoc('tenders', isNew ? null : id)
  const { data: comments } = useSubcollection('tenders', isNew ? null : id, 'comments', { orderBy: ['createdAt', 'asc'] })
  const { data: activities } = useSubcollection('tenders', isNew ? null : id, 'activities', { orderBy: ['createdAt', 'desc'] })
  const { data: users } = useCollection('users')
  const [commentText, setCommentText] = useState('')
  const [snackbar, setSnackbar] = useState(null)

  if (isNew) return <NewTenderForm onCancel={() => navigate('/tenders')} onCreated={(id) => navigate(`/tenders/${id}`)} />

  if (loading) return <Typography>Loading...</Typography>
  if (!tender) return (
    <Box textAlign="center" py={6}>
      <Typography>Tender not found</Typography>
      <Button onClick={() => navigate('/tenders')} sx={{ mt: 2 }}>Back to tenders</Button>
    </Box>
  )

  const eligibleAssignees = users.filter(u => u.active !== false && canSeeTenders(u.role))
  const days = daysUntil(tender.submissionDeadline)

  let countdownBg = '#F0F0F0', countdownText = '', countdownColor = '#475569'
  if (tender.submissionDeadline) {
    if (days < 0) { countdownBg = '#FEE2E2'; countdownColor = '#991B1B'; countdownText = `❗ Deadline passed ${-days} days ago` }
    else if (days === 0) { countdownBg = '#FEE2E2'; countdownColor = '#991B1B'; countdownText = '🔥 Deadline TODAY!' }
    else if (days === 1) { countdownBg = '#FEE2E2'; countdownColor = '#991B1B'; countdownText = '⏰ Deadline tomorrow' }
    else if (days <= 3) { countdownBg = '#FED7AA'; countdownColor = '#9A3412'; countdownText = `⏰ ${days} days left` }
    else if (days <= 7) { countdownBg = '#FEF3C7'; countdownColor = '#92400E'; countdownText = `📅 ${days} days left` }
    else { countdownText = `📅 ${days} days until deadline` }
  }

  const postComment = async () => {
    if (!commentText.trim()) return
    try {
      const mentionMatches = commentText.match(/@([A-Za-z][A-Za-z0-9_]*)/g) || []
      const mentionTokens = mentionMatches.map(m => m.slice(1).toLowerCase())
      const mentionedUsers = users.filter(u => {
        const firstName = u.name?.split(' ')[0]?.toLowerCase() || ''
        return mentionTokens.includes(firstName)
      })

      await addSubdoc('tenders', id, 'comments', {
        text: commentText.trim(),
        authorUid: user.uid, authorName: user.name,
        mentionedUids: mentionedUsers.map(u => u.uid),
        mentionedNames: mentionedUsers.map(u => u.name)
      })
      await addSubdoc('tenders', id, 'activities', {
        type: 'COMMENT_ADDED', notes: 'Added a comment',
        authorUid: user.uid, authorName: user.name
      })
      for (const m of mentionedUsers) {
        if (m.uid !== user.uid) {
          await createDoc('notifications', {
            forUid: m.uid, type: 'MENTION',
            title: `${user.name} mentioned you`,
            body: commentText.trim().slice(0, 120),
            targetType: 'tender', targetId: id, targetCode: tender.tenderCode,
            createdByUid: user.uid, createdByName: user.name, read: false
          })
        }
      }
      setCommentText('')
    } catch (err) {
      setSnackbar({ severity: 'error', msg: err.message })
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await updateDocById('tenders', id, { status: newStatus })
      await addSubdoc('tenders', id, 'activities', {
        type: 'STATUS_CHANGED',
        notes: `Status changed from ${tenderStatusLabel(tender.status)} to ${tenderStatusLabel(newStatus)}`,
        authorUid: user.uid, authorName: user.name
      })
      setSnackbar({ severity: 'success', msg: `Status → ${tenderStatusLabel(newStatus)}` })
    } catch (err) {
      setSnackbar({ severity: 'error', msg: err.message })
    }
  }

  const handleReassign = async (newUid) => {
    const newU = eligibleAssignees.find(u => u.uid === newUid)
    if (!newU) return
    try {
      const oldUid = tender.assignedTo
      const oldName = tender.assignedToName
      await updateDocById('tenders', id, {
        assignedTo: newU.uid,
        assignedToName: newU.name,
        previousAssignedTo: oldUid,
        previousAssignedToName: oldName,
        assignedAt: new Date()
      })
      await addSubdoc('tenders', id, 'activities', {
        type: 'REASSIGNED',
        notes: `Reassigned from ${oldName || 'no one'} to ${newU.name}`,
        authorUid: user.uid, authorName: user.name
      })
      if (newU.uid !== user.uid) {
        await createDoc('notifications', {
          forUid: newU.uid, type: 'ASSIGNED',
          title: 'Tender assigned to you',
          body: `${tender.title || tender.tenderCode} — by ${user.name}`,
          targetType: 'tender', targetId: id, targetCode: tender.tenderCode,
          createdByUid: user.uid, createdByName: user.name, read: false
        })
      }
      setSnackbar({ severity: 'success', msg: `Assigned to ${newU.name}` })
    } catch (err) {
      setSnackbar({ severity: 'error', msg: err.message })
    }
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate('/tenders')}><ArrowBack /></IconButton>
        <Box sx={{ ml: 1, flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{tender.title || tender.tenderNumber || 'Untitled'}</Typography>
          <Typography variant="caption" color="text.secondary">{tender.tenderCode}</Typography>
        </Box>
        <Chip label={tenderStatusLabel(tender.status)}
          sx={{ bgcolor: `${tenderStatusColor(tender.status)}20`, color: tenderStatusColor(tender.status), fontWeight: 600 }} />
      </Stack>

      {/* Countdown banner */}
      {tender.submissionDeadline && (
        <Card sx={{ mb: 2, bgcolor: countdownBg, border: 'none' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: countdownColor, fontWeight: 700 }}>{countdownText}</Typography>
            <Typography variant="body2" sx={{ color: countdownColor }}>
              {formatDateTime(tender.submissionDeadline)}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Typography variant="h6" sx={{ color: tenderStatusColor(tender.status), fontWeight: 700 }}>
                    {tenderStatusLabel(tender.status)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">Estimated value</Typography>
                  <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700 }}>
                    {formatINRFull(tender.estimatedValue)}
                  </Typography>
                </Box>
              </Stack>
              <TextField size="small" select fullWidth label="Change status" value={tender.status}
                onChange={(e) => handleStatusChange(e.target.value)}>
                {ALL_TENDER_STATUS.map(s => <MenuItem key={s} value={s}>{tenderStatusLabel(s)}</MenuItem>)}
              </TextField>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>📑 Identification</Typography>
              <Grid container spacing={2}>
                <InfoField label="Tender Number" value={tender.tenderNumber} />
                <InfoField label="Authority" value={tender.authority === 'Other' ? tender.authorityOther : tender.authority} />
                <InfoField label="Tender Date" value={formatDate(tender.tenderDate)} />
                <InfoField label="Pre-bid Meeting" value={formatDateTime(tender.preBidMeetingDate)} />
                <InfoField label="Submission Deadline" value={formatDateTime(tender.submissionDeadline)} />
                <InfoField label="Result Date" value={formatDate(tender.resultDate)} />
              </Grid>
            </CardContent>
          </Card>

          {(tender.emdAmount > 0 || tender.pbgAmount > 0) && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>💰 Money & Guarantees</Typography>
                <Grid container spacing={2}>
                  <InfoField label="EMD Amount" value={tender.emdAmount > 0 ? formatINRFull(tender.emdAmount) : ''} />
                  <InfoField label="EMD Validity" value={tender.emdValidityDays > 0 ? `${tender.emdValidityDays} days` : ''} />
                  <InfoField label="EMD Refunded" value={tender.emdRefunded ? '✅ Yes' : '⏳ No'} />
                  <InfoField label="PBG Amount" value={tender.pbgAmount > 0 ? formatINRFull(tender.pbgAmount) : ''} />
                </Grid>
              </CardContent>
            </Card>
          )}

          {tender.items?.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>📦 Items ({tender.items.length})</Typography>
                <Stack spacing={1.5}>
                  {tender.items.map((item, i) => (
                    <Box key={i} sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 600 }}>{item.name}</Typography>
                          {item.specifications && <Typography variant="body2" color="text.secondary">{item.specifications}</Typography>}
                          <Typography variant="caption" color="text.secondary">
                            Qty: {item.quantity} {item.ourBrand && `• Brand: ${item.ourBrand}`}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 600 }}>{formatINRFull(item.quantity * item.unitPrice)}</Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {tender.competitors?.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>🥊 Competitors ({tender.competitors.length})</Typography>
                <Stack spacing={1}>
                  {tender.competitors.map((c, i) => (
                    <Box key={i} sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 2 }}>
                      <Typography sx={{ fontWeight: 600 }}>{c.name}</Typography>
                      {c.notes && <Typography variant="body2" color="text.secondary">{c.notes}</Typography>}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {tender.notes && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>📝 Notes</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{tender.notes}</Typography>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>💬 Comments ({comments.length})</Typography>
              <Stack spacing={1.5}>
                {comments.map((c) => (
                  <Box key={c.id} sx={{ display: 'flex', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 14 }}>
                      {initials(c.authorName)}
                    </Avatar>
                    <Box sx={{ flex: 1, p: 1.5, bgcolor: '#F7F4FB', borderRadius: 2 }}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.authorName}</Typography>
                        <Typography variant="caption" color="text.secondary">{relativeTime(c.createdAt)}</Typography>
                      </Stack>
                      <Typography variant="body2">{c.text}</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
              <Stack direction="row" spacing={1} mt={2}>
                <TextField size="small" fullWidth multiline maxRows={4}
                  placeholder="Write a comment... use @name to mention"
                  value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                <Button variant="contained" onClick={postComment} disabled={!commentText.trim()}>
                  <Send />
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Owned by</Typography>
              <Stack direction="row" alignItems="center" spacing={1.5} my={1}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>{initials(tender.assignedToName)}</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>{tender.assignedToName || 'Unassigned'}</Typography>
                  {tender.previousAssignedToName && (
                    <Typography variant="caption" color="text.secondary">
                      Previously: {tender.previousAssignedToName}
                    </Typography>
                  )}
                </Box>
              </Stack>
              <TextField size="small" select fullWidth label="Assign to"
                value={tender.assignedTo || ''} onChange={(e) => handleReassign(e.target.value)}
                sx={{ mt: 1 }}>
                {eligibleAssignees.map(u => (
                  <MenuItem key={u.uid} value={u.uid}>{u.name} ({roleLabel(u.role)})</MenuItem>
                ))}
              </TextField>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>📅 Activity</Typography>
              <Stack spacing={1.5}>
                {activities.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No activity yet</Typography>
                )}
                {activities.slice(0, 20).map((a) => (
                  <Box key={a.id} sx={{
                    p: 1.5, borderLeft: '3px solid', borderColor: 'primary.main',
                    bgcolor: '#FAF7FE', borderRadius: '0 8px 8px 0'
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{a.notes || a.type}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {a.authorName} • {relativeTime(a.createdAt)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)}>
        {snackbar && <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>}
      </Snackbar>
    </Box>
  )
}

function InfoField({ label, value }) {
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '-'}</Typography>
    </Grid>
  )
}

function NewTenderForm({ onCancel, onCreated }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    tenderNumber: '', title: '', authority: 'GMSCL', authorityOther: '',
    submissionDeadline: '', resultDate: '',
    emdAmount: '', emdValidityDays: '', pbgAmount: '', estimatedValue: '',
    status: 'DRAFT', winProbability: 50, notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title && !form.tenderNumber) {
      setSnackbar({ severity: 'warning', msg: 'Enter title or tender number' })
      return
    }
    setSaving(true)
    try {
      const code = await generateCode('tenders', 'TND')
      const ref = await createDoc('tenders', {
        tenderCode: code,
        tenderNumber: form.tenderNumber, title: form.title,
        authority: form.authority, authorityOther: form.authorityOther,
        submissionDeadline: form.submissionDeadline ? Timestamp.fromDate(new Date(form.submissionDeadline)) : null,
        resultDate: form.resultDate ? Timestamp.fromDate(new Date(form.resultDate)) : null,
        emdAmount: Number(form.emdAmount) || 0,
        emdValidityDays: Number(form.emdValidityDays) || 0,
        pbgAmount: Number(form.pbgAmount) || 0,
        estimatedValue: Number(form.estimatedValue) || 0,
        status: form.status,
        winProbability: Number(form.winProbability) || 50,
        notes: form.notes,
        items: [], competitors: [],
        assignedTo: user.uid, assignedToName: user.name,
        assignedAt: new Date(),
        createdBy: user.uid, createdByName: user.name
      })
      await addSubdoc('tenders', ref.id, 'activities', {
        type: 'TENDER_CREATED', notes: 'Tender created',
        authorUid: user.uid, authorName: user.name
      })
      onCreated(ref.id)
    } catch (err) {
      setSnackbar({ severity: 'error', msg: err.message })
      setSaving(false)
    }
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" mb={2}>
        <IconButton onClick={onCancel}><ArrowBack /></IconButton>
        <Typography variant="h5" sx={{ ml: 1, fontWeight: 700 }}>New Tender</Typography>
      </Stack>
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}><Typography variant="subtitle2" color="primary">Identification</Typography></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth label="Tender Number" value={form.tenderNumber} onChange={(e) => set('tenderNumber', e.target.value)} /></Grid>
            <Grid item xs={12} sm={8}><TextField fullWidth label="Title *" value={form.title} onChange={(e) => set('title', e.target.value)} /></Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth select label="Authority" value={form.authority} onChange={(e) => set('authority', e.target.value)}>
                {TenderAuthorities.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </TextField>
            </Grid>
            {form.authority === 'Other' && (
              <Grid item xs={6} sm={4}><TextField fullWidth label="Authority name" value={form.authorityOther} onChange={(e) => set('authorityOther', e.target.value)} /></Grid>
            )}

            <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="subtitle2" color="primary">Dates</Typography></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth type="datetime-local" label="Submission Deadline" InputLabelProps={{ shrink: true }} value={form.submissionDeadline} onChange={(e) => set('submissionDeadline', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Result Date" InputLabelProps={{ shrink: true }} value={form.resultDate} onChange={(e) => set('resultDate', e.target.value)} /></Grid>

            <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="subtitle2" color="primary">Money</Typography></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="EMD Amount" value={form.emdAmount} onChange={(e) => set('emdAmount', e.target.value)} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="EMD Days" value={form.emdValidityDays} onChange={(e) => set('emdValidityDays', e.target.value)} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="PBG Amount" value={form.pbgAmount} onChange={(e) => set('pbgAmount', e.target.value)} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="Estimated Value" value={form.estimatedValue} onChange={(e) => set('estimatedValue', e.target.value)} /></Grid>

            <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="subtitle2" color="primary">Status</Typography></Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth select label="Bid Status" value={form.status} onChange={(e) => set('status', e.target.value)}>
                {ALL_TENDER_STATUS.map(s => <MenuItem key={s} value={s}>{tenderStatusLabel(s)}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="number" label="Win Probability %" value={form.winProbability} onChange={(e) => set('winProbability', e.target.value)} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Grid>
          </Grid>
          <Stack direction="row" spacing={1} justifyContent="flex-end" mt={3}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button variant="contained" onClick={submit} disabled={saving} startIcon={<Save />}>
              {saving ? 'Saving...' : 'Create Tender'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)}>
        {snackbar && <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>}
      </Snackbar>
    </Box>
  )
}
