import { useNavigate } from 'react-router-dom'
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Chip, Stack, Button,
  Divider, useTheme, useMediaQuery
} from '@mui/material'
import {
  TrendingUp, AssignmentTurnedIn, Whatshot, AttachMoney,
  AccessTime, EmojiEvents, Description, Group
} from '@mui/icons-material'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { useCollection } from '../utils/firestoreHooks'
import {
  ALL_LEAD_STAGES, stageLabel, stageColor, canSeeLeads, canSeeTenders,
  canSeeBothDashboards, ALL_TENDER_STATUS, tenderStatusLabel, tenderStatusColor
} from '../utils/models'
import { formatINR, formatINRFull, isThisMonth, daysUntil, tsToDate, initials } from '../utils/format'

export default function Dashboard() {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()
  const { data: leads } = useCollection('leads', { orderBy: ['createdAt', 'desc'] })
  const { data: tenders } = useCollection('tenders', { orderBy: ['createdAt', 'desc'] })
  const { data: users } = useCollection('users')

  const showLeads = canSeeLeads(user.role)
  const showTenders = canSeeTenders(user.role)
  const showBoth = canSeeBothDashboards(user.role)

  // ===== Lead stats =====
  const activeLeads = leads.filter(l => !['LOST', 'PAYMENT_DONE'].includes(l.stage))
  const pipelineValue = activeLeads.reduce((s, l) => s + (l.estimatedValue || 0), 0)
  const wonThisMonth = leads.filter(l => l.stage === 'PAYMENT_DONE' && isThisMonth(l.updatedAt))
  const wonValue = wonThisMonth.reduce((s, l) => s + (l.estimatedValue || 0), 0)
  const hotLeads = leads.filter(l => l.priority === 'HOT' && !['LOST', 'PAYMENT_DONE'].includes(l.stage))
  const myLeads = leads.filter(l => l.assignedTo === user.uid)

  // ===== Tender stats =====
  const activeTenders = tenders.filter(t => ['DRAFT', 'SUBMITTED', 'PENDING_RESULT'].includes(t.status))
  const tenderValue = activeTenders.reduce((s, t) => s + (t.estimatedValue || 0), 0)
  const urgentTenders = tenders.filter(t => {
    const days = daysUntil(t.submissionDeadline)
    return days !== null && days >= 0 && days <= 7 && ['DRAFT', 'SUBMITTED'].includes(t.status)
  })
  const wonTenders = tenders.filter(t => t.status === 'WON')

  // ===== Charts data =====
  const stageChartData = ALL_LEAD_STAGES.filter(s => !['LOST'].includes(s)).map((s) => {
    const stageLeads = leads.filter(l => l.stage === s)
    return {
      stage: stageLabel(s).split(' ')[0],
      count: stageLeads.length,
      value: stageLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0)
    }
  })

  const tenderStatusChart = ALL_TENDER_STATUS.map((s) => ({
    name: tenderStatusLabel(s).replace(/[🏆]/g, '').trim(),
    value: tenders.filter(t => t.status === s).length,
    color: tenderStatusColor(s)
  })).filter(x => x.value > 0)

  // Monthly trend (last 6 months)
  const monthlyTrend = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const monthLeads = leads.filter(l => {
      const d = tsToDate(l.createdAt)
      return d && d >= month && d <= monthEnd
    })
    const monthWon = monthLeads.filter(l => l.stage === 'PAYMENT_DONE')
    monthlyTrend.push({
      month: month.toLocaleString('default', { month: 'short' }),
      created: monthLeads.length,
      won: monthWon.length,
      value: monthWon.reduce((s, l) => s + (l.estimatedValue || 0), 0) / 100000  // in lakhs
    })
  }

  return (
    <Box>
      {/* Welcome banner */}
      <Card sx={{
        mb: 3, p: 3,
        background: 'linear-gradient(135deg, #7E5F9C 0%, #5B3F77 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(126, 95, 156, 0.3)'
      }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Welcome back, {user.name?.split(' ')[0]} 👋
        </Typography>
        <Typography sx={{ opacity: 0.9 }}>
          Here's what's happening at Mediford today
        </Typography>
      </Card>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {showLeads && (
          <>
            <Grid item xs={6} md={3}>
              <KpiCard
                icon={<AssignmentTurnedIn />}
                label="Active Leads"
                value={activeLeads.length}
                color="#7E5F9C"
                onClick={() => navigate('/leads')}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <KpiCard
                icon={<AttachMoney />}
                label="Pipeline Value"
                value={formatINR(pipelineValue)}
                color="#185FA5"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <KpiCard
                icon={<EmojiEvents />}
                label="Won This Month"
                value={formatINR(wonValue)}
                subtitle={`${wonThisMonth.length} deals`}
                color="#1D9E75"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <KpiCard
                icon={<Whatshot />}
                label="Hot Leads"
                value={hotLeads.length}
                color="#DC2626"
              />
            </Grid>
          </>
        )}
        {showTenders && (
          <>
            <Grid item xs={6} md={3}>
              <KpiCard
                icon={<Description />}
                label="Active Tenders"
                value={activeTenders.length}
                color="#7E5F9C"
                onClick={() => navigate('/tenders')}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <KpiCard
                icon={<AttachMoney />}
                label="Tender Value"
                value={formatINR(tenderValue)}
                color="#185FA5"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <KpiCard
                icon={<AccessTime />}
                label="Urgent (≤7 days)"
                value={urgentTenders.length}
                color={urgentTenders.length > 0 ? '#DC2626' : '#94A3B8'}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <KpiCard
                icon={<EmojiEvents />}
                label="Tenders Won"
                value={wonTenders.length}
                subtitle={formatINR(wonTenders.reduce((s, t) => s + (t.estimatedValue || 0), 0))}
                color="#1D9E75"
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {showLeads && (
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>📊 Sales Pipeline</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stageChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) => name === 'value'
                        ? [formatINR(value * 1), 'Value']
                        : [value, 'Count']
                      }
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" name="Leads" radius={[6, 6, 0, 0]}>
                      {stageChartData.map((entry, idx) => (
                        <Cell key={idx} fill={stageColor(ALL_LEAD_STAGES.filter(s => s !== 'LOST')[idx])} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {showTenders && tenderStatusChart.length > 0 && (
          <Grid item xs={12} md={showLeads ? 4 : 6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>📑 Tender Status</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tenderStatusChart}
                      dataKey="value" nameKey="name"
                      cx="50%" cy="50%"
                      outerRadius={90}
                      label={(e) => `${e.name}: ${e.value}`}
                      labelLine={false}
                    >
                      {tenderStatusChart.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {showLeads && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>📈 6-Month Trend</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="created" stroke="#7E5F9C" strokeWidth={2} name="Leads Created" />
                    <Line type="monotone" dataKey="won" stroke="#1D9E75" strokeWidth={2} name="Deals Won" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Hot leads & urgent tenders */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {showLeads && hotLeads.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">🔥 Hot Leads</Typography>
                  <Button size="small" onClick={() => navigate('/leads')}>View all</Button>
                </Stack>
                <Stack spacing={1}>
                  {hotLeads.slice(0, 5).map((l) => (
                    <Box key={l.id}
                      onClick={() => navigate(`/leads/${l.id}`)}
                      sx={{
                        p: 1.5, borderRadius: 2, cursor: 'pointer',
                        bgcolor: 'rgba(220, 38, 38, 0.04)',
                        border: '1px solid rgba(220, 38, 38, 0.15)',
                        '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.08)' }
                      }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>{l.title || l.leadCode}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {l.orgName} • {stageLabel(l.stage)}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {formatINR(l.estimatedValue)}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {showTenders && urgentTenders.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">⏰ Urgent Tender Deadlines</Typography>
                  <Button size="small" onClick={() => navigate('/tenders')}>View all</Button>
                </Stack>
                <Stack spacing={1}>
                  {urgentTenders.slice(0, 5).map((t) => {
                    const days = daysUntil(t.submissionDeadline)
                    const urgent = days <= 3
                    return (
                      <Box key={t.id}
                        onClick={() => navigate(`/tenders/${t.id}`)}
                        sx={{
                          p: 1.5, borderRadius: 2, cursor: 'pointer',
                          bgcolor: urgent ? 'rgba(220, 38, 38, 0.04)' : 'rgba(239, 159, 39, 0.04)',
                          border: `1px solid ${urgent ? 'rgba(220, 38, 38, 0.15)' : 'rgba(239, 159, 39, 0.15)'}`,
                          '&:hover': { opacity: 0.8 }
                        }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>{t.title || t.tenderCode}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t.authority === 'Other' ? t.authorityOther : t.authority}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            label={days === 0 ? 'TODAY' : days === 1 ? 'Tomorrow' : `${days} days`}
                            color={urgent ? 'error' : 'warning'}
                          />
                        </Stack>
                      </Box>
                    )
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Workload (admin/manager) */}
      {showBoth && users.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>⚖️ Team Workload</Typography>
            <Grid container spacing={2}>
              {users.filter(u => u.active !== false).map((u) => {
                const theirActiveLeads = leads.filter(l => l.assignedTo === u.uid && !['LOST', 'PAYMENT_DONE'].includes(l.stage))
                const theirActiveTenders = tenders.filter(t => t.assignedTo === u.uid && ['DRAFT', 'SUBMITTED', 'PENDING_RESULT'].includes(t.status))
                const pipeline = theirActiveLeads.reduce((s, l) => s + (l.estimatedValue || 0), 0) +
                  theirActiveTenders.reduce((s, t) => s + (t.estimatedValue || 0), 0)
                return (
                  <Grid item xs={12} sm={6} md={4} key={u.uid}>
                    <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>{initials(u.name)}</Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 600 }} noWrap>{u.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{u.role}</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
                        <Chip size="small" label={`${theirActiveLeads.length} leads`} variant="outlined" />
                        <Chip size="small" label={`${theirActiveTenders.length} tenders`} variant="outlined" />
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 1, color: 'primary.main', fontWeight: 600 }}>
                        {formatINR(pipeline)}
                      </Typography>
                    </Box>
                  </Grid>
                )
              })}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

function KpiCard({ icon, label, value, subtitle, color, onClick }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' } : {}
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            )}
          </Box>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2,
            bgcolor: `${color}15`, color,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
