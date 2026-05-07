import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Avatar, Menu, MenuItem, Divider,
  useMediaQuery, useTheme
} from '@mui/material'
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, ListAlt, Description,
  CalendarMonth, PrintOutlined, Group, Person, Logout, BusinessCenter, Inventory
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { canSeeLeads, canSeeTenders, canManageTeam, roleLabel } from '../utils/models'
import { initials } from '../utils/format'

const DRAWER_WIDTH = 240

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileMenu, setProfileMenu] = useState(null)

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    canSeeLeads(user.role) && { label: 'Leads', path: '/leads', icon: <ListAlt /> },
    canSeeTenders(user.role) && { label: 'Tenders', path: '/tenders', icon: <Description /> },
    canSeeTenders(user.role) && { label: 'Batches', path: '/batches', icon: <Inventory /> },
    { label: 'Calendar', path: '/calendar', icon: <CalendarMonth /> },
    { label: 'Reports', path: '/reports', icon: <PrintOutlined /> },
    canManageTeam(user.role) && { label: 'Team', path: '/team', icon: <Group /> }
  ].filter(Boolean)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FAF7FE' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2,
          background: 'linear-gradient(135deg, #7E5F9C, #5B3F77)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <BusinessCenter sx={{ color: 'white', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Mediford
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Lead Manager
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List sx={{ flex: 1, py: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
          return (
            <ListItem key={item.path} disablePadding sx={{ px: 1, py: 0.25 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={() => isMobile && setMobileOpen(false)}
                selected={active}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: 'white' }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? 'white' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
            {initials(user.name)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{user.name}</Typography>
            <Typography variant="caption" color="text.secondary">{roleLabel(user.role)}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'white', color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <Toolbar>
          <IconButton
            edge="start" onClick={() => setMobileOpen(true)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {navItems.find((i) =>
              location.pathname === i.path ||
              (i.path !== '/' && location.pathname.startsWith(i.path))
            )?.label || 'Mediford Inquiry'}
          </Typography>
          <IconButton onClick={(e) => setProfileMenu(e.currentTarget)}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              {initials(user.name)}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={profileMenu} open={Boolean(profileMenu)}
            onClose={() => setProfileMenu(null)}
          >
            <MenuItem onClick={() => { setProfileMenu(null); navigate('/profile') }}>
              <ListItemIcon><Person fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setProfileMenu(null); handleLogout() }}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary" open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent" open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: '1px solid rgba(0,0,0,0.06)' }
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{
        flexGrow: 1,
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        pt: { xs: 9, sm: 10 },
        px: { xs: 2, sm: 3 },
        pb: 4
      }}>
        <Outlet />
      </Box>
    </Box>
  )
}
