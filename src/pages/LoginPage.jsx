import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  InputAdornment, IconButton
} from '@mui/material'
import { Visibility, VisibilityOff, BusinessCenter } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
        ? 'Invalid email or password'
        : err.code === 'auth/too-many-requests'
        ? 'Too many attempts. Try again in a few minutes.'
        : err.message
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #7E5F9C 0%, #5B3F77 100%)',
      px: 2
    }}>
      <Card sx={{ width: '100%', maxWidth: 420, py: 1 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7E5F9C, #5B3F77)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              mb: 2
            }}>
              <BusinessCenter sx={{ color: 'white', fontSize: 32 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#2D1F40' }}>
              Mediford Inquiry
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lead & Tender Manager
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Email" type="email" margin="normal"
              value={email} onChange={(e) => setEmail(e.target.value)}
              autoFocus required
            />
            <TextField
              fullWidth label="Password"
              type={showPassword ? 'text' : 'password'} margin="normal"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            <Button
              fullWidth variant="contained" type="submit"
              sx={{ mt: 3, py: 1.3 }}
              disabled={loading}
              size="large"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
            Use the same login as your phone app
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
