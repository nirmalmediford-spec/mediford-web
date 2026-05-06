import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Stack, Chip, Avatar, Button, IconButton,
  TextField, Divider, Grid, MenuItem, Tooltip, Snackbar, Alert
} from '@mui/material'
import {
  ArrowBack, Phone, WhatsApp, Email, Edit, Save, Send, PersonAdd
} from '@mui/icons-material'
import { useDoc, useSubcollection, addSubdoc, updateDocById, useCollection, createDoc } from '../utils/firestoreHooks'
import { serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import {
  ALL_LEAD_STAGES, stageLabel, stageColor, Priority, priorityColor, canSeeLeads, roleLabel
} from '../utils/models'
import { formatINRFull, formatDateTime, relativeTime, initials } from '../utils/format'

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isNew = id === 'new'
  const { data: lead, loading } = useDoc('leads', isNew ? null : id)
  const { data: comments } = useSubcollection('leads', isNew ? null : id, 'comments', { orderBy: ['createdAt', 'asc'] })
  const { data: activities } = useSubcollection('leads', isNew ? null : id, 'activities', { orderBy: ['createdAt', 'desc'] })
  const { data: users } = useCollection('users')
  const [commentText, setCommentText] = useState('')
  const [snackbar, setSnackbar] = useState(null)

  if (isNew) return <NewLeadForm onCancel={() => navigate('/leads')} onCreated={(id) => navigate(`/leads/${id}`)} />

  if (loading) return <Typography>Loading...</Typography>
  if (!lead) return (
    <Box textAlign="center" py={6}>
      <Typography>Lead not found</Typography>
      <Button onClick={() => navigate('/leads')} sx={{ mt: 2 }}>Back to leads</Button>
    </Box>
  )

  const owner = users.find(u => u.uid === lead.assignedTo)
  const eligibleAssignees = users.filter(u => u.active !== false && canSeeLeads(u.role))

  const postComment = async () => {
    if (!commentText.trim()) return
    try {
      // Parse @mentions
      const mentionMatches = commentText.match(/@([A-Za-z][A-Za-z0-9_]*)/g) || []
      const mentionTokens = mentionMatches.map(m => m.slice(1).toLowerCase())
      const mentionedUsers = users.filter(u => {
        const firstName = u.name?.split(' ')[0]?.toLowerCase() || ''
        const fullName = u.name?.replace(/\s+/g, '').toLowerCase() || ''
        return mentionTokens.includes(firstName) || mentionTokens.includes(fullName)
      })

      await addSubdoc('leads', id, 'comments', {
        text: commentText.trim(),
        authorUid: user.uid,
        authorName: user.name,
        mentionedUids: mentionedUsers.map(u => u.uid),
        mentionedNames: mentionedUsers.map(u => u.name)
      })
      await addSubdoc('leads', id, 'activities', {
        type: 'COMMENT_ADDED',
        notes: 'Added a comment',
        authorUid: user.uid,
        authorName: user.name
      })
      // Send notifications to mentioned users
      for (const m of mentionedUsers) {
        if (m.uid !== user.uid) {
          await createDoc('notifications', {
            forUid: m.uid,
            type: 'MENTION',
            title: `${user.name} mentioned you`,
            body: commentText.trim().slice(0, 120),
            targetType: 'lead',
            targetId: id,
            targetCode: lead.leadCode,
            createdByUid: user.uid,
            createdByName: user.name,
            read: false
          })
        }
      }
      setCommentText('')
    } catch (err) {
      console.error(err)
      setSnackbar({ severity: 'error', msg: err.message })
    }
  }

  const handleStageChange = async (newStage) => {
    try {
      await updateDocById('leads', id, { stage: newStage })
      await addSubdoc('leads', id, 'activities', {
        type: 'STAGE_CHANGED',
        notes: `Stage changed from ${stageLabel(lead.stage)} to ${stageLabel(newStage)}`,
        authorUid: user.uid,
        authorName: user.name
      })
      setSnackbar({ severity: 'success', msg: `Stage → ${stageLabel(newStage)}` })
    } catch (err) {
      setSnackbar({ severity: 'error', msg: err.message })
    }
  }

  const handleReassign = async (newUid) => {
    const newU = eligibleAssignees.find(u => u.uid === newUid)
    if (!newU) return
    try {
      const oldUid = lead.assignedTo
      const oldName = lead.assignedToName
      await updateDocById('leads', id, {
        assignedTo: newU.uid,
        assignedToName: newU.name,
        previousAssignedTo: oldUid,
        previousAssignedToName: oldName,
        assignedAt: new Date()
      })
      await addSubdoc('leads', id, 'activities', {
        type: 'REASSIGNED',
        notes: `Reassigned from ${oldName || 'no one'} to ${newU.name}`,
        authorUid: user.uid,
        authorName: user.name
      })
      // Notifications
      if (newU.uid !== user.uid) {
        await createDoc('notifications', {
          forUid: newU.uid, type: 'ASSIGNED',
          title: 'Lead assigned to you',
          body: `${lead.title || lead.leadCode} — by ${user.name}`,
          targetType: 'lead', targetId: id, targetCode: lead.leadCode,
          createdByUid: user.uid, createdByName: user.name, read: false
        })
      }
      if (oldUid && oldUid !== user.uid && oldUid !== newU.uid) {
        await createDoc('notifications', {
          forUid: oldUid, type: 'UNASSIGNED',
          title: 'Lead reassigned',
          body: `${lead.title || lead.leadCode} reassigned to ${newU.name}`,
          targetType: 'lead', targetId: id, targetCode: lead.leadCode,
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
        <IconButton onClick={() => navigate('/leads')}><ArrowBack /></IconButton>
        <Box sx={{ ml: 1, flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{lead.title || 'Untitled lead'}</Typography>
          <Typography variant="caption" color="text.secondary">{lead.leadCode}</Typography>
        </Box>
        <Chip label={lead.priority} sx={{ bgcolor: `${priorityColor(lead.priority)}20`, color: priorityColor(lead.priority), fontWeight: 600 }} />
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          {/* Stage + Value card */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Current stage</Typography>
                  <Typography variant="h6" sx={{ color: stageColor(lead.stage), fontWeight: 700 }}>
                    {stageLabel(lead.stage)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">Estimated value</Typography>
                  <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700 }}>
                    {formatINRFull(lead.estimatedValue)}
                  </Typography>
                </Box>
              </Stack>
              <TextField
                size="small" select fullWidth label="Move to stage" value={lead.stage}
                onChange={(e) => handleStageChange(e.target.value)}
              >
                {ALL_LEAD_STAGES.map(s => <MenuItem key={s} value={s}>{stageLabel(s)}</MenuItem>)}
              </TextField>
            </CardContent>
          </Card>

          {/* Org info */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>🏥 Organization</Typography>
              <Grid container spacing={2}>
                <InfoField label="Org Name" value={lead.orgName} />
                <InfoField label="Type" value={lead.leadType} />
                <InfoField label="City" value={lead.city} />
                <InfoField label="State" value={lead.state} />
                <InfoField label="Pincode" value={lead.pincode} />
                <InfoField label="GST Number" value={lead.gstNumber} />
              </Grid>
            </CardContent>
          </Card>

          {/* Contact card */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>👤 Primary Contact</Typography>
              <Stack direction="row" spacing={2} alignItems="center" mb={1.5}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  {initials(lead.contactPersonName)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">{lead.contactPersonName || '-'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {lead.contactDesignation}
                  </Typography>
                </Box>
                {lead.contactPhone && (
                  <>
                    <Tooltip title="Call">
                      <IconButton component="a" href={`tel:${lead.contactPhone}`}
                        sx={{ bgcolor: '#1D9E7515', color: '#1D9E75' }}>
                        <Phone />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="WhatsApp">
                      <IconButton component="a"
                        href={`https://wa.me/${String(lead.contactPhone).replace(/\D/g, '')}`}
                        target="_blank"
                        sx={{ bgcolor: '#25D36615', color: '#25D366' }}>
                        <WhatsApp />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                {lead.contactEmail && (
                  <Tooltip title="Email">
                    <IconButton component="a" href={`mailto:${lead.contactEmail}`}
                      sx={{ bgcolor: '#185FA515', color: '#185FA5' }}>
                      <Email />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
              <Grid container spacing={2}>
                <InfoField label="Phone" value={lead.contactPhone} />
                <InfoField label="Email" value={lead.contactEmail} />
              </Grid>
            </CardContent>
          </Card>

          {/* Notes */}
          {lead.notes && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>📝 Notes</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{lead.notes}</Typography>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
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
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.authorName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {relativeTime(c.createdAt)}
                        </Typography>
                      </Stack>
                      <Typography variant="body2">{c.text}</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
              <Stack direction="row" spacing={1} mt={2}>
                <TextField
                  size="small" fullWidth multiline maxRows={4}
                  placeholder="Write a comment... use @name to mention"
                  value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) postComment()
                  }}
                />
                <Button variant="contained" onClick={postComment} disabled={!commentText.trim()}>
                  <Send />
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Owner card */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Owned by</Typography>
              <Stack direction="row" alignItems="center" spacing={1.5} my={1}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>{initials(lead.assignedToName)}</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>{lead.assignedToName || 'Unassigned'}</Typography>
                  {lead.previousAssignedToName && (
                    <Typography variant="caption" color="text.secondary">
                      Previously: {lead.previousAssignedToName}
                    </Typography>
                  )}
                </Box>
                {owner?.phone && owner.uid !== user.uid && (
                  <>
                    <IconButton size="small" component="a" href={`tel:${owner.phone}`}
                      sx={{ color: '#1D9E75' }}>
                      <Phone fontSize="small" />
                    </IconButton>
                    <IconButton size="small" component="a"
                      href={`https://wa.me/${String(owner.phone).replace(/\D/g, '')}`} target="_blank"
                      sx={{ color: '#25D366' }}>
                      <WhatsApp fontSize="small" />
                    </IconButton>
                  </>
                )}
              </Stack>
              <TextField
                size="small" select fullWidth label="Assign to"
                value={lead.assignedTo || ''}
                onChange={(e) => handleReassign(e.target.value)}
                sx={{ mt: 1 }}
              >
                {eligibleAssignees.map(u => (
                  <MenuItem key={u.uid} value={u.uid}>{u.name} ({roleLabel(u.role)})</MenuItem>
                ))}
              </TextField>
            </CardContent>
          </Card>

          {/* Activity timeline */}
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
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {a.notes || a.type}
                    </Typography>
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
        {snackbar && <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)}>{snackbar.msg}</Alert>}
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

// Inline new-lead form
function NewLeadForm({ onCancel, onCreated }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: '', leadType: 'HOSPITAL', stage: 'NEW', priority: 'WARM',
    estimatedValue: '', probability: 50,
    orgName: '', contactPersonName: '', contactPhone: '', contactEmail: '',
    city: '', state: 'Gujarat', pincode: '', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title && !form.orgName) {
      setSnackbar({ severity: 'warning', msg: 'Enter at least title or org name' })
      return
    }
    setSaving(true)
    try {
      const code = await generateCode('leads', 'LEAD')
      const ref = await createDoc('leads', {
        ...form,
        leadCode: code,
        estimatedValue: Number(form.estimatedValue) || 0,
        probability: Number(form.probability) || 50,
        assignedTo: user.uid, assignedToName: user.name,
        assignedAt: new Date(),
        createdBy: user.uid, createdByName: user.name
      })
      await addSubdoc('leads', ref.id, 'activities', {
        type: 'LEAD_CREATED',
        notes: 'Lead created',
        authorUid: user.uid, authorName: user.name
      })
      onCreated(ref.id)
    } catch (err) {
      console.error(err)
      setSnackbar({ severity: 'error', msg: err.message })
      setSaving(false)
    }
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" mb={2}>
        <IconButton onClick={onCancel}><ArrowBack /></IconButton>
        <Typography variant="h5" sx={{ ml: 1, fontWeight: 700 }}>New Lead</Typography>
      </Stack>
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}><Typography variant="subtitle2" color="primary">Basic Info</Typography></Grid>
            <Grid item xs={12} sm={8}><TextField fullWidth label="Title *" value={form.title} onChange={(e) => set('title', e.target.value)} /></Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth select label="Type" value={form.leadType} onChange={(e) => set('leadType', e.target.value)}>
                <MenuItem value="HOSPITAL">Hospital/Clinic</MenuItem>
                <MenuItem value="DEALER">Dealer/Distributor</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth select label="Stage" value={form.stage} onChange={(e) => set('stage', e.target.value)}>
                {ALL_LEAD_STAGES.map(s => <MenuItem key={s} value={s}>{stageLabel(s)}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth select label="Priority" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {Object.values(Priority).map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Estimated Value (₹)" type="number" value={form.estimatedValue} onChange={(e) => set('estimatedValue', e.target.value)} />
            </Grid>

            <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="subtitle2" color="primary">Organization</Typography></Grid>
            <Grid item xs={12} sm={8}><TextField fullWidth label="Org Name *" value={form.orgName} onChange={(e) => set('orgName', e.target.value)} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth label="GST Number" value={form.gstNumber || ''} onChange={(e) => set('gstNumber', e.target.value)} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="City" value={form.city} onChange={(e) => set('city', e.target.value)} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="State" value={form.state} onChange={(e) => set('state', e.target.value)} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Pincode" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} /></Grid>

            <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="subtitle2" color="primary">Primary Contact</Typography></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Name" value={form.contactPersonName} onChange={(e) => set('contactPersonName', e.target.value)} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth label="Phone" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth label="Email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} /></Grid>

            <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="subtitle2" color="primary">Notes</Typography></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Grid>
          </Grid>
          <Stack direction="row" spacing={1} justifyContent="flex-end" mt={3}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button variant="contained" onClick={submit} disabled={saving} startIcon={<Save />}>
              {saving ? 'Saving...' : 'Create Lead'}
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
