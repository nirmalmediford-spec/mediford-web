import { useState } from 'react'
import {
  Box, Card, CardContent, Typography, Stack, Avatar, TextField, Button,
  Snackbar, Alert, Chip, Divider, Grid
} from '@mui/material'
import { Save } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { updateDocById } from '../utils/firestoreHooks'
import { initials } from '../utils/format'
import { roleLabel } from '../utils/models'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [name, setName] = useState(user.name || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [designation, setDesignation] = useState(user.designation || '')
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState(null)

  const save = async () => {
    setSaving(true)
    try {
      await updateDocById('users', user.uid, { name, phone, designation })
      setSnackbar({ severity: 'success', msg: 'Profile updated' })
    } catch (err) {
      setSnackbar({ severity: 'error', msg: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box maxWidth={600}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>My Profile</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80, fontSize: 32 }}>
              {initials(name || user.email)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{name || user.email}</Typography>
              <Chip
                size="small"
                label={roleLabel(user.role)}
                color={user.role === 'ADMIN' ? 'error' : user.role === 'MANAGER' ? 'warning' : 'primary'}
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" value={user.email || ''} disabled />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} />
            </Grid>
          </Grid>
          <Stack direction="row" justifyContent="flex-end" spacing={1} mt={3}>
            <Button variant="contained" onClick={save} disabled={saving} startIcon={<Save />}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Account Info</Typography>
          <Stack spacing={1}>
            <Box>
              <Typography variant="caption" color="text.secondary">User ID</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{user.uid}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Role</Typography>
              <Typography variant="body2">{roleLabel(user.role)}</Typography>
            </Box>
          </Stack>
          <Button variant="outlined" color="error" sx={{ mt: 2 }} onClick={logout}>
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)}>
        {snackbar && <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>}
      </Snackbar>
    </Box>
  )
}
