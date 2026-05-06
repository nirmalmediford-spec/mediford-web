import { Box, Card, CardContent, Typography, Stack, Button, Grid } from '@mui/material'
import { PictureAsPdf, Description, Group, AssignmentTurnedIn } from '@mui/icons-material'
import { useCollection } from '../utils/firestoreHooks'
import { generateLeadsReport, generateTendersReport, generateTeamPerformanceReport } from '../utils/pdf'
import { canSeeLeads, canSeeTenders, canManageTeam } from '../utils/models'
import { useAuth } from '../contexts/AuthContext'

export default function ReportsPage() {
  const { user } = useAuth()
  const { data: leads } = useCollection('leads')
  const { data: tenders } = useCollection('tenders')
  const { data: users } = useCollection('users')

  const reports = [
    canSeeLeads(user.role) && {
      title: 'Leads Pipeline Report',
      description: 'Complete pipeline with all leads, stages, values, and owners',
      icon: <AssignmentTurnedIn fontSize="large" />,
      color: '#7E5F9C',
      onClick: () => generateLeadsReport(leads),
      stats: `${leads.length} leads`
    },
    canSeeLeads(user.role) && {
      title: 'Active Leads Only',
      description: 'Only leads currently in pipeline (excludes Won/Lost)',
      icon: <AssignmentTurnedIn fontSize="large" />,
      color: '#185FA5',
      onClick: () => generateLeadsReport(leads.filter(l => !['LOST', 'PAYMENT_DONE'].includes(l.stage)), { subtitle: 'Active leads only' }),
      stats: `${leads.filter(l => !['LOST', 'PAYMENT_DONE'].includes(l.stage)).length} active leads`
    },
    canSeeTenders(user.role) && {
      title: 'Tenders Report',
      description: 'All tenders with status, deadlines, and values',
      icon: <Description fontSize="large" />,
      color: '#7E5F9C',
      onClick: () => generateTendersReport(tenders),
      stats: `${tenders.length} tenders`
    },
    canSeeTenders(user.role) && {
      title: 'Active Tenders Only',
      description: 'Only ongoing tenders (Draft / Submitted / Awaiting result)',
      icon: <Description fontSize="large" />,
      color: '#EF9F27',
      onClick: () => generateTendersReport(
        tenders.filter(t => ['DRAFT', 'SUBMITTED', 'PENDING_RESULT'].includes(t.status)),
        { subtitle: 'Active tenders only' }
      ),
      stats: `${tenders.filter(t => ['DRAFT', 'SUBMITTED', 'PENDING_RESULT'].includes(t.status)).length} active tenders`
    },
    canManageTeam(user.role) && {
      title: 'Team Performance Report',
      description: 'Per-user stats: active leads, won deals, tender outcomes',
      icon: <Group fontSize="large" />,
      color: '#1D9E75',
      onClick: () => generateTeamPerformanceReport(users, leads, tenders),
      stats: `${users.filter(u => u.active !== false).length} team members`
    }
  ].filter(Boolean)

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>📊 Reports</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Generate PDF reports for meetings, reviews, and analysis. All reports include Mediford branding.
      </Typography>

      <Grid container spacing={2}>
        {reports.map((r, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card sx={{
              height: '100%',
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }
            }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: 2,
                    bgcolor: `${r.color}15`, color: r.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {r.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{r.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, minHeight: 40 }}>
                      {r.description}
                    </Typography>
                    <Typography variant="caption" sx={{ color: r.color, fontWeight: 600, display: 'block', mt: 1 }}>
                      {r.stats}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<PictureAsPdf />}
                    onClick={r.onClick}
                    fullWidth
                    sx={{ bgcolor: r.color, '&:hover': { bgcolor: r.color, opacity: 0.9 } }}
                  >
                    Download PDF
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
