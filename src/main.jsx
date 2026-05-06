import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'

const theme = createTheme({
  palette: {
    primary: {
      main: '#7E5F9C',  // Mediford purple - matches Android app
      light: '#A485BC',
      dark: '#5B3F77',
      contrastText: '#fff'
    },
    secondary: {
      main: '#1D9E75'   // green
    },
    error: { main: '#D32F2F' },
    warning: { main: '#EF9F27' },
    success: { main: '#1D9E75' },
    info: { main: '#185FA5' },
    background: {
      default: '#F7F4FB',
      paper: '#FFFFFF'
    }
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", "Roboto", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.04)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10 }
      }
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)
