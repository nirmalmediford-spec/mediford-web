import { useState } from 'react'
import {
  Box, Card, CardContent, Typography, Stack, Avatar, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Snackbar, Alert, Grid, Divider
} from '@mui/material'
import { Edit, Phone, Email, Business } from '@mui/icons-material'
import { useCollection, updateDocById } from '../utils/firestoreHooks'
import { ALL_ROLES, roleLabel } from '../utils/models'
import { initials } from '../utils/format'
import { useAuth } from '../contexts/AuthContext'

export default function TeamPage() {
  const { user: me } = useAuth()
  const { data: users, loading } = useCollection('users')
  const [editing, setEditing] = useState(null)
  const [snackbar, setSnackbar] = useState(null)

  const activeUsers = users.filter(u => u.active !== false)
  const inactiveUsers = users.filter(u => u.active === false)

  const handleSave = async (updates) => {
    try {
      await updateDocById('users', editing.uid, updates)
      setSnackbar({ severity: 'success', msg: 'Updated successfully' })
      setEditing(null)
    } catch (err) {
      setSnackbar({ severity: 'error', msg: err.message })
    }
  }

  const renderUserCard = (u) => (
    <Grid item xs={12} sm={6} md={4} key={u.uid}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Avatar sx={{
              bgcolor: u.active !== false ? 'primary.main' : 'grey.400',
              width: 56, height: 56, fontSize: 22
            }}>
              {initials(u.name)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h6" sx={{ fontWeight: 600 }} noWrap>
                  {u.name || u.email}
                </Typography>
                {u.uid === me.uid && <Chip size="small" label="You" color="primary" variant="outlined" />}
              </Stack>
              <Chip
                size="small"
                label={roleLabel(u.role)}
                color={u.role === 'ADMIN' ? 'error' : u.role === 'MANAGER' ? 'warning' : 'default'}
                sx={{ mt: 0.5 }}
              />
            </Box>
            <IconButton onClick={() => setEditing(u)}><Edit fontSize="small" /></IconButton>
          </Stack>
          <Divider sx={{ my: 1.5 }} />
          <Stack spacing={0.5}>
            {u.email && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Email fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>{u.email}</Typography>
              </Stack>
            )}
            {u.phone && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Phone fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="caption">{u.phone}</Typography>
              </Stack>
            )}
            {u.designation && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Business fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="caption">{u.designation}</Typography>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  )

  return (
    <Box>
      <Stack direction="row" alignItems="center" mb={2}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>👥 Team</Typography>
          <Typography variant="body2" color="text.secondary">
            {activeUsers.length} active members{inactiveUsers.length > 0 && ` • ${inactiveUsers.length} inactive`}
          </Typography>
        </Box>
      </Stack>

      <Typography variant="h6" sx={{ mt: 2, mb: 1.5, fontWeight: 600 }}>Active Members</Typography>
      <Grid container spacing={2}>
        {activeUsers.map(renderUserCard)}
      </Grid>

      {inactiveUsers.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mt: 4, mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
            Inactive Members
          </Typography>
          <Grid container spacing={2}>
            {inactiveUsers.map(renderUserCard)}
          </Grid>
        </>
      )}

      {editing && (
        <EditUserDialog user={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      )}

      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)}>
        {snackbar && <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>}
      </Snackbar>
    </Box>
  )
}

function EditUserDialog({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user.name || '',
    role: user.role || 'SALES',
    phone: user.phone || '',
    designation: user.designation || '',
    active: user.active !== false
  })

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Member</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField label="Email" value={user.email || ''} disabled />
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ALL_ROLES.map(r => <MenuItem key={r} value={r}>{roleLabel(r)}</MenuItem>)}
          </TextField>
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          <TextField select label="Status" value={form.active ? 'active' : 'inactive'}
            onChange={(e) => setForm({ ...form, active: e.target.value === 'active' })}>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(form)}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}
