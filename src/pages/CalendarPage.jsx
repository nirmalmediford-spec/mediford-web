import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Stack, Chip, Button, IconButton, ToggleButton, ToggleButtonGroup
} from '@mui/material'
import { ChevronLeft, ChevronRight, Today } from '@mui/icons-material'
import { useCollection } from '../utils/firestoreHooks'
import { tsToDate, formatDate } from '../utils/format'
import { canSeeLeads, canSeeTenders, tenderStatusLabel, tenderStatusColor } from '../utils/models'
import { useAuth } from '../contexts/AuthContext'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, addMonths, subMonths, isToday
} from 'date-fns'

export default function CalendarPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const showLeads = canSeeLeads(user.role)
  const showTenders = canSeeTenders(user.role)

  const { data: tenders } = useCollection('tenders')
  const { data: leads } = useCollection('leads')

  // Collect all events
  const events = useMemo(() => {
    const list = []
    if (showTenders) {
      tenders.forEach(t => {
        const date = tsToDate(t.submissionDeadline)
        if (date) {
          list.push({
            id: `tender-deadline-${t.id}`,
            date,
            title: `📑 ${t.title || t.tenderCode} deadline`,
            type: 'tender-deadline',
            status: t.status,
            color: tenderStatusColor(t.status),
            onClick: () => navigate(`/tenders/${t.id}`)
          })
        }
        const preBid = tsToDate(t.preBidMeetingDate)
        if (preBid) {
          list.push({
            id: `tender-prebid-${t.id}`,
            date: preBid,
            title: `🤝 Pre-bid: ${t.title || t.tenderCode}`,
            type: 'pre-bid',
            color: '#185FA5',
            onClick: () => navigate(`/tenders/${t.id}`)
          })
        }
      })
    }
    return list
  }, [tenders, showTenders, navigate])

  // Calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const eventsForDay = (day) => events.filter(e => isSameDay(e.date, day))

  return (
    <Box>
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft /></IconButton>
          <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center', fontWeight: 700 }}>
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight /></IconButton>
          <Button startIcon={<Today />} onClick={() => setCurrentMonth(new Date())}>Today</Button>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1}>
            <Chip size="small" label={`📑 ${tenders.length} tenders`} />
            <Chip size="small" label={`📋 ${leads.length} leads`} />
          </Stack>
        </Stack>
      </Card>

      <Card>
        <CardContent>
          {/* Day headers */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <Typography key={d} variant="caption" sx={{ fontWeight: 600, textAlign: 'center', color: 'text.secondary' }}>
                {d}
              </Typography>
            ))}
          </Box>
          {/* Day cells */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {days.map(day => {
              const inMonth = isSameMonth(day, currentMonth)
              const today = isToday(day)
              const dayEvents = eventsForDay(day)
              return (
                <Box key={day.toISOString()} sx={{
                  minHeight: 100, p: 1,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: today ? 'primary.main' : '#eee',
                  bgcolor: today ? '#FAF7FE' : (inMonth ? 'white' : '#F9FAFB'),
                  opacity: inMonth ? 1 : 0.5
                }}>
                  <Typography variant="caption" sx={{
                    fontWeight: today ? 700 : 500,
                    color: today ? 'primary.main' : 'text.primary',
                    display: 'block', mb: 0.5
                  }}>
                    {format(day, 'd')}
                  </Typography>
                  <Stack spacing={0.5}>
                    {dayEvents.slice(0, 3).map(e => (
                      <Box key={e.id}
                        onClick={e.onClick}
                        sx={{
                          p: 0.5, borderRadius: 1,
                          bgcolor: `${e.color}20`, color: e.color,
                          fontSize: 10, fontWeight: 500,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: `${e.color}30` },
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                        {e.title}
                      </Box>
                    ))}
                    {dayEvents.length > 3 && (
                      <Typography variant="caption" color="text.secondary">+{dayEvents.length - 3} more</Typography>
                    )}
                  </Stack>
                </Box>
              )
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Today's events */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>📅 Today's events</Typography>
          {eventsForDay(new Date()).length === 0 ? (
            <Typography variant="body2" color="text.secondary">No events today</Typography>
          ) : (
            <Stack spacing={1}>
              {eventsForDay(new Date()).map(e => (
                <Box key={e.id} onClick={e.onClick}
                  sx={{ p: 1.5, borderRadius: 2, bgcolor: `${e.color}10`, cursor: 'pointer' }}>
                  <Typography sx={{ fontWeight: 500 }}>{e.title}</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
