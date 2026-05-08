<<<<<<< HEAD
import { useEffect, useState, useCallback, useRef } from 'react'
import { labsAPI, overrideAPI } from '../api'
import { ChevronLeft, ChevronRight, MapPin, Users, Monitor, Wind, AlertTriangle, RefreshCw } from 'lucide-react'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const DAYS  = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
const HOURS = [8,9,10,11,12,13,14,15,16,17]

/* ── Time helpers ────────────────────────────────────────────────────────
 * Spring Boot serialises LocalTime as "HH:MM:SS" string when
 * spring.jackson.serialization.write-dates-as-timestamps=false
 * (which we now set). Parse both string and array forms defensively.
 */
function parseHour(t) {
  if (!t && t !== 0) return -1
  if (Array.isArray(t)) return t[0]            // [9, 15] → 9
  if (typeof t === 'string') return parseInt(t.split(':')[0], 10)  // "09:15:00" → 9
  return -1
}
function formatTime(t) {
  if (!t && t !== 0) return ''
  if (Array.isArray(t)) return `${String(t[0]).padStart(2,'0')}:${String(t[1]).padStart(2,'0')}`
  if (typeof t === 'string') return t.substring(0,5)  // "09:15:00" → "09:15"
  return ''
}

/* ── Colour maps ─────────────────────────────────────────────────────── */
const SLOT_BG = {
  REGULAR_CLASS:   'bg-blue-50 border-blue-300 text-blue-800',
  BOOKED:          'bg-green-50 border-green-300 text-green-800',
  FREE:            'bg-gray-50  border-gray-200  text-gray-500',
  OVERRIDDEN_SLOT: 'bg-red-100  border-red-400   text-red-800',
}
const BOOKING_STYLE = {
  APPROVED:   { bg: 'bg-green-100  border-green-400',  text: 'text-green-800',  badge: 'bg-green-600',  label: 'Approved'   },
  IN_REVIEW:  { bg: 'bg-amber-100  border-amber-400',  text: 'text-amber-800',  badge: 'bg-amber-500',  label: 'In Review'  },
  PENDING:    { bg: 'bg-yellow-100 border-yellow-400', text: 'text-yellow-800', badge: 'bg-yellow-500', label: 'Pending'    },
  OVERRIDDEN: { bg: 'bg-red-100    border-red-300',    text: 'text-red-700',    badge: 'bg-red-600',    label: 'Overridden' },
}

export default function LabSchedulePage() {
  const [labs, setLabs]               = useState([])
  const [selectedLab, setSelectedLab] = useState(null)
  const [timetable, setTimetable]     = useState([])     // full weekly timetable from /labs/{id}/timetable
  const [weekStart, setWeekStart]     = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [loading, setLoading]         = useState(false)
  const [view, setView]               = useState('week')
  const [selectedDay, setSelectedDay] = useState(DAYS[Math.max(0, new Date().getDay() - 1)])
  const [activeOverrides, setActiveOverrides] = useState([])
  const [refreshKey, setRefreshKey]   = useState(0)
  const cacheRef = useRef({})

  /* Stable fetch — cache keyed by labId:date */
  const fetchDayData = useCallback(async (labId, date) => {
    const key = `${labId}:${date}`
    if (cacheRef.current[key]) return cacheRef.current[key]
    try {
      const res  = await labsAPI.getAvailability(labId, date)
      const raw  = res.data.data || []
      // API returns List<Object> = [ List<TimetableSlotResponse>, List<BookingResponse>, List<OverrideEventResponse> ]
      const result = {
        slots:     Array.isArray(raw[0]) ? raw[0] : [],
        bookings:  Array.isArray(raw[1]) ? raw[1] : [],
        overrides: Array.isArray(raw[2]) ? raw[2] : [],
      }
      cacheRef.current[key] = result
      return result
    } catch { return { slots: [], bookings: [], overrides: [] } }
  }, [])

  const clearCache = () => { cacheRef.current = {}; setRefreshKey(k => k+1); toast.success('Schedule refreshed') }
  const changeWeek = delta => { cacheRef.current = {}; setWeekStart(d => addDays(d, delta * 7)) }
  const selectLab  = lab   => { cacheRef.current = {}; setSelectedLab(lab); setRefreshKey(k => k+1) }

  /* Initial load */
  useEffect(() => {
    labsAPI.getAll().then(r => {
      const all = r.data.data || []
      setLabs(all)
      if (all.length) setSelectedLab(all[0])
    }).catch(() => toast.error('Failed to load labs'))
    overrideAPI.getActive().then(r => setActiveOverrides(r.data.data || [])).catch(() => {})
  }, [])

  /* Reload timetable when lab changes */
  useEffect(() => {
    if (!selectedLab) return
    setLoading(true)
    cacheRef.current = {}
    labsAPI.getTimetable(selectedLab.id)
      .then(r => setTimetable(r.data.data || []))
=======
import { useEffect, useState } from 'react'
import { labsAPI } from '../api'
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock, Users, Monitor, Wind } from 'lucide-react'
import { format, addDays, startOfWeek } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

const SLOT_COLORS = {
  REGULAR_CLASS: 'bg-blue-100 border-blue-300 text-blue-800',
  BOOKED: 'bg-amber-100 border-amber-300 text-amber-800',
  FREE: 'bg-green-100 border-green-300 text-green-800',
}

export default function LabSchedulePage() {
  const [labs, setLabs] = useState([])
  const [selectedLab, setSelectedLab] = useState(null)
  const [timetable, setTimetable] = useState([])
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('week') // 'week' | 'day'
  const [selectedDay, setSelectedDay] = useState(DAYS[0])

  useEffect(() => {
    labsAPI.getAll()
      .then(res => {
        const allLabs = res.data.data || []
        setLabs(allLabs)
        if (allLabs.length > 0) setSelectedLab(allLabs[0])
      })
      .catch(() => toast.error('Failed to load labs'))
  }, [])

  useEffect(() => {
    if (!selectedLab) return
    setLoading(true)
    labsAPI.getTimetable(selectedLab.id)
      .then(res => setTimetable(res.data.data || []))
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
      .catch(() => toast.error('Failed to load timetable'))
      .finally(() => setLoading(false))
  }, [selectedLab])

<<<<<<< HEAD
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Schedule</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time availability — colour-coded by booking status</p>
        </div>
        <button onClick={clearCache} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Override banners */}
      {activeOverrides.map(oe => (
        <div key={oe.id} className="flex items-start gap-3 p-4 bg-red-50 border border-red-300 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-800 text-sm">🚫 Override Active: {oe.title}</p>
            <p className="text-red-700 text-xs mt-0.5">
              {oe.overrideDate} · {formatTime(oe.startTime)} – {formatTime(oe.endTime)}
              {oe.affectedDivisions ? ` · Divisions: ${oe.affectedDivisions}` : ''}
              {oe.affectedLabs?.length > 0 ? ` · Labs: ${oe.affectedLabs.map(l => l.roomNumber).join(', ')}` : ''}
            </p>
          </div>
          {oe.isMandatory && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">MANDATORY</span>}
        </div>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lab selector */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Select Lab</h2>
          {labs.map(lab => (
            <button key={lab.id} onClick={() => selectLab(lab)}
              className={clsx('w-full text-left p-4 rounded-xl border transition-all',
                selectedLab?.id === lab.id
                  ? 'border-primary-500 bg-primary-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-primary-300')}>
=======
  const getSlotsForDayAndTime = (day, timeStr) => {
    return timetable.filter(slot => {
      if (slot.dayOfWeek !== day) return false
      const slotStart = slot.startTime
      return slotStart === timeStr || slotStart?.startsWith(timeStr)
    })
  }

  const prevWeek = () => setWeekStart(d => addDays(d, -7))
  const nextWeek = () => setWeekStart(d => addDays(d, 7))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lab Schedule</h1>
        <p className="text-gray-500 text-sm mt-1">View weekly timetable and real-time lab availability</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lab selector sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Select Lab</h2>
          {labs.map(lab => (
            <button
              key={lab.id}
              onClick={() => setSelectedLab(lab)}
              className={clsx(
                'w-full text-left p-4 rounded-xl border transition-all',
                selectedLab?.id === lab.id
                  ? 'border-primary-500 bg-primary-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50'
              )}
            >
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-primary-600" />
                <span className="font-semibold text-gray-900 text-sm">{lab.roomNumber}</span>
              </div>
              <p className="text-xs text-gray-600 truncate">{lab.labName}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
<<<<<<< HEAD
                <Users className="w-3 h-3"/>{lab.capacity}
                {lab.hasProjector && <><Monitor className="w-3 h-3 ml-1"/>Proj</>}
                {lab.hasAc && <><Wind className="w-3 h-3 ml-1"/>AC</>}
              </div>
            </button>
          ))}

          {/* Legend */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">Legend</p>
            {[
              { c:'bg-blue-100   border-blue-400',   l:'Regular Class'    },
              { c:'bg-green-100  border-green-400',  l:'Approved Booking' },
              { c:'bg-amber-100  border-amber-400',  l:'In Review'        },
              { c:'bg-yellow-100 border-yellow-400', l:'Pending'          },
              { c:'bg-red-100    border-red-400',    l:'Overridden'       },
            ].map(({c,l}) => (
              <div key={l} className="flex items-center gap-2 text-xs text-gray-600">
                <div className={clsx('w-3 h-3 rounded border flex-shrink-0',c)}/>{l}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
=======
                <Users className="w-3 h-3" /> {lab.capacity}
                {lab.hasProjector && <><Monitor className="w-3 h-3 ml-1" /> Projector</>}
                {lab.hasAc && <><Wind className="w-3 h-3 ml-1" /> AC</>}
              </div>
            </button>
          ))}
        </div>

        {/* Timetable */}
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
        <div className="lg:col-span-3">
          {/* Controls */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
<<<<<<< HEAD
                <button onClick={() => changeWeek(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-4 h-4"/></button>
                <span className="text-sm font-medium text-gray-700">Week of {format(weekStart,'dd MMM yyyy')}</span>
                <button onClick={() => changeWeek(1)}  className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-4 h-4"/></button>
              </div>
              <div className="flex gap-2">
                {['week','day'].map(v => (
                  <button key={v} onClick={() => setView(v)}
                    className={clsx('px-3 py-1.5 text-sm rounded-lg capitalize',
                      view===v ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
=======
                <button onClick={prevWeek} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  Week of {format(weekStart, 'dd MMM yyyy')}
                </span>
                <button onClick={nextWeek} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                {['week', 'day'].map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={clsx(
                      'px-3 py-1.5 text-sm rounded-lg capitalize transition-colors',
                      view === v ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
                    {v}
                  </button>
                ))}
              </div>
            </div>
<<<<<<< HEAD
            {view==='day' && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {DAYS.map((d,i) => {
                  const date = format(addDays(weekStart,i),'yyyy-MM-dd')
                  const hasOv = activeOverrides.some(oe => oe.overrideDate===date)
                  return (
                    <button key={d} onClick={() => setSelectedDay(d)}
                      className={clsx('px-3 py-1 text-xs rounded-full transition-colors relative',
                        selectedDay===d ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                      {d.slice(0,3)}
                      {hasOv && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500"/>}
                    </button>
                  )
                })}
=======

            {/* Day selector for day view */}
            {view === 'day' && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {DAYS.map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={clsx(
                      'px-3 py-1 text-xs rounded-full capitalize transition-colors',
                      selectedDay === d ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
              </div>
            )}
          </div>

          {loading ? (
<<<<<<< HEAD
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"/></div>
          ) : !selectedLab ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">Select a lab</div>
          ) : view==='week' ? (
            <WeekView
              key={`w-${selectedLab.id}-${format(weekStart,'yyyyMMdd')}-${refreshKey}`}
              timetable={timetable}
              weekStart={weekStart}
              labId={selectedLab.id}
              activeOverrides={activeOverrides}
              fetchDayData={fetchDayData}
            />
          ) : (
            <DayView
              key={`d-${selectedLab.id}-${selectedDay}-${refreshKey}`}
              timetable={timetable.filter(s => s.dayOfWeek===selectedDay)}
              day={selectedDay}
              date={format(addDays(weekStart, DAYS.indexOf(selectedDay)),'yyyy-MM-dd')}
              labId={selectedLab.id}
              activeOverrides={activeOverrides}
              fetchDayData={fetchDayData}
            />
          )}
=======
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
          ) : !selectedLab ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
              Select a lab to view its schedule
            </div>
          ) : view === 'week' ? (
            <WeekView timetable={timetable} weekStart={weekStart} />
          ) : (
            <DayView
              timetable={timetable.filter(s => s.dayOfWeek === selectedDay)}
              day={selectedDay}
            />
          )}

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            {Object.entries(SLOT_COLORS).map(([type, cls]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={clsx('w-3 h-3 rounded border', cls)} />
                <span>{type.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
        </div>
      </div>
    </div>
  )
}

<<<<<<< HEAD
/* ── WeekView ─────────────────────────────────────────────────────────── */
function WeekView({ timetable, weekStart, labId, activeOverrides, fetchDayData }) {
  const [dayData, setDayData] = useState({})  // { 'yyyy-MM-dd': { bookings, overrides } }

  useEffect(() => {
    if (!labId) return
    const run = async () => {
      for (let i = 0; i < 6; i++) {
        const date = format(addDays(weekStart, i), 'yyyy-MM-dd')
        const data = await fetchDayData(labId, date)
        setDayData(prev => ({ ...prev, [date]: data }))
      }
    }
    run()
  }, [labId, weekStart, fetchDayData])

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        <div className="p-3 border-r border-gray-200 text-xs text-gray-400 text-right">Time</div>
        {DAYS.map((day, i) => {
          const date    = format(addDays(weekStart, i), 'yyyy-MM-dd')
          const isToday = isSameDay(addDays(weekStart, i), new Date())
          const hasOv   = activeOverrides.some(oe => oe.overrideDate === date)
          return (
            <div key={day} className={clsx('p-3 text-center border-r border-gray-200 last:border-0', isToday && 'bg-primary-50')}>
              <p className={clsx('text-xs font-bold', isToday ? 'text-primary-700' : 'text-gray-700')}>{day.slice(0,3)}</p>
              <p className="text-xs text-gray-400">{format(addDays(weekStart,i),'dd MMM')}</p>
              {hasOv && <div className="w-2 h-2 rounded-full bg-red-500 mx-auto mt-1" title="Override active"/>}
            </div>
          )
        })}
      </div>

      {/* Hour rows */}
      <div className="overflow-y-auto max-h-[520px]">
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-7 border-b border-gray-100 min-h-[60px]">
            <div className="p-2 text-xs text-gray-400 border-r border-gray-100 text-right pr-3 pt-2">
              {String(hour).padStart(2,'0')}:00
            </div>
            {DAYS.map((day, i) => {
              const date = format(addDays(weekStart, i), 'yyyy-MM-dd')
              const dd   = dayData[date] || {}

              /* Regular timetable slots for this day+hour */
              const slots = timetable.filter(s =>
                s.dayOfWeek === day && parseHour(s.startTime) === hour)

              /* Approved/pending bookings for this date+hour */
              const bookings = (dd.bookings || []).filter(b =>
                parseHour(b.startTime) === hour)

              /* Override events for this date+hour */
              const overrideEvts = (dd.overrides || []).filter(oe =>
                parseHour(oe.startTime) === hour)

              return (
                <div key={day} className="p-0.5 border-r border-gray-100 last:border-0 space-y-0.5">
                  {overrideEvts.map(oe => (
                    <div key={`oe-${oe.id}`}
                      className="text-[10px] p-1 rounded border bg-red-100 border-red-400 text-red-800"
                      title={oe.description}>
                      <p className="font-bold truncate">🚫 {oe.title}</p>
                    </div>
                  ))}
                  {slots.map(slot => (
                    <div key={`s-${slot.id}`}
                      className={clsx('text-[10px] p-1 rounded border truncate',
                        slot.isOverridden ? SLOT_BG.OVERRIDDEN_SLOT : (SLOT_BG[slot.slotType] || SLOT_BG.FREE))}
                      title={`${slot.subjectName} · ${slot.division} · ${slot.facultyName}${slot.isOverridden?' [OVERRIDDEN]':''}`}>
                      <p className="font-medium truncate">{slot.isOverridden?'🚫 ':''}{slot.subjectName||'Free'}</p>
                      <p className="opacity-70 truncate">{slot.division}</p>
                    </div>
                  ))}
                  {bookings.map(b => {
                    const bc = BOOKING_STYLE[b.status] || BOOKING_STYLE.PENDING
                    return (
                      <div key={`b-${b.id}`}
                        className={clsx('text-[10px] p-1 rounded border truncate', bc.bg)}
                        title={`${b.purpose} — ${b.status} — ${b.referenceNumber}`}>
                        <p className={clsx('font-medium truncate', bc.text)}>{b.purpose}</p>
                        <p className="opacity-70 truncate">{b.referenceNumber}</p>
                      </div>
                    )
                  })}
=======
function WeekView({ timetable, weekStart }) {
  const displayDays = DAYS.slice(0, 6)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        <div className="p-3 text-xs font-medium text-gray-400 border-r border-gray-100" />
        {displayDays.map((day, i) => (
          <div key={day} className="p-3 text-center border-r border-gray-100 last:border-0">
            <p className="text-xs font-semibold text-gray-700">{day.slice(0, 3)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {format(addDays(weekStart, i), 'dd MMM')}
            </p>
          </div>
        ))}
      </div>

      {/* Time rows */}
      <div className="overflow-y-auto max-h-[500px]">
        {TIME_SLOTS.map(time => (
          <div key={time} className="grid grid-cols-7 border-b border-gray-100 min-h-[60px]">
            <div className="p-2 text-xs text-gray-400 border-r border-gray-100 flex items-start justify-end pr-3 pt-2">
              {time}
            </div>
            {displayDays.map(day => {
              const slots = timetable.filter(s =>
                s.dayOfWeek === day && s.startTime?.startsWith(time.split(':')[0])
              )
              return (
                <div key={day} className="p-1 border-r border-gray-100 last:border-0">
                  {slots.map(slot => (
                    <div
                      key={slot.id}
                      className={clsx(
                        'text-xs p-1.5 rounded border mb-1 truncate cursor-default',
                        SLOT_COLORS[slot.slotType] || SLOT_COLORS.FREE
                      )}
                      title={`${slot.subjectName} · ${slot.division} · ${slot.facultyName}`}
                    >
                      <p className="font-medium truncate">{slot.subjectName}</p>
                      <p className="opacity-75 truncate">{slot.division}</p>
                    </div>
                  ))}
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

<<<<<<< HEAD
/* ── DayView ─────────────────────────────────────────────────────────── */
function DayView({ timetable, day, date, labId, activeOverrides, fetchDayData }) {
  const [data, setData]       = useState({ slots:[], bookings:[], overrides:[] })
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!labId) return
    setFetching(true)
    fetchDayData(labId, date).then(d => { setData(d); setFetching(false) })
  }, [labId, date, fetchDayData])

  const dayOverrides = activeOverrides.filter(oe => oe.overrideDate === date)

  /* Merge everything and sort by start time */
  const allEvents = [
    ...timetable.map(s => ({ ...s, _type:'slot',     _h: parseHour(s.startTime) })),
    ...data.bookings.map(b => ({ ...b, _type:'booking',  _h: parseHour(b.startTime) })),
    ...dayOverrides.map(oe => ({ ...oe, _type:'override', _h: parseHour(oe.startTime) })),
  ].sort((a, b) => a._h - b._h)

  if (fetching) return (
    <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"/></div>
  )

  if (!allEvents.length) return (
    <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
      <p className="text-4xl mb-3">📅</p>
      <p>No events scheduled on {day}</p>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      {allEvents.map((evt, idx) => (
        <div key={idx} className="flex items-start gap-4 p-4">
          <div className="w-28 shrink-0 text-right">
            <p className="text-sm font-semibold text-gray-700">{formatTime(evt.startTime)}</p>
            <p className="text-xs text-gray-400">– {formatTime(evt.endTime)}</p>
          </div>

          {evt._type === 'override' ? (
            <div className="flex-1 p-3 rounded-lg border bg-red-100 border-red-400">
              <div className="flex items-center gap-2 flex-wrap">
                <AlertTriangle className="w-4 h-4 text-red-600"/>
                <p className="font-bold text-sm text-red-800">{evt.title}</p>
                {evt.isMandatory && <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded">MANDATORY</span>}
              </div>
              {evt.description && <p className="text-xs text-red-700 mt-1 opacity-80">{evt.description}</p>}
              {evt.affectedDivisions && <p className="text-xs text-red-600 mt-1">Divisions: {evt.affectedDivisions}</p>}
            </div>

          ) : evt._type === 'slot' ? (
            <div className={clsx('flex-1 p-3 rounded-lg border',
              evt.isOverridden ? SLOT_BG.OVERRIDDEN_SLOT : (SLOT_BG[evt.slotType] || SLOT_BG.FREE))}>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{evt.subjectName || 'Free Slot'}</p>
                {evt.isOverridden && <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded">OVERRIDDEN</span>}
              </div>
              <p className="text-xs mt-0.5 opacity-80">{evt.division} · {evt.facultyName}</p>
              {evt.isOverridden && evt.overriddenByEventTitle && (
                <p className="text-xs text-red-600 mt-1 italic">→ {evt.overriddenByEventTitle}</p>
              )}
            </div>

          ) : (() => {
            const bc = BOOKING_STYLE[evt.status] || BOOKING_STYLE.PENDING
            return (
              <div className={clsx('flex-1 p-3 rounded-lg border', bc.bg)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={clsx('font-semibold text-sm', bc.text)}>{evt.purpose}</p>
                  <span className={clsx('text-xs px-1.5 py-0.5 rounded font-medium text-white', bc.badge)}>
                    {bc.label}
                  </span>
                </div>
                <p className="text-xs mt-0.5 opacity-80">{evt.requester?.fullName} · {evt.referenceNumber}</p>
                {evt.status === 'OVERRIDDEN' && evt.overriddenByEventTitle && (
                  <p className="text-xs text-red-600 mt-1 italic">→ {evt.overriddenByEventTitle}</p>
                )}
              </div>
            )
          })()}
=======
function DayView({ timetable, day }) {
  if (timetable.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>No classes scheduled on {day}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      {[...timetable].sort((a, b) => a.startTime?.localeCompare(b.startTime)).map(slot => (
        <div key={slot.id} className="flex items-start gap-4 p-4">
          <div className="w-24 shrink-0 text-right">
            <p className="text-sm font-medium text-gray-700">{slot.startTime}</p>
            <p className="text-xs text-gray-400">to {slot.endTime}</p>
          </div>
          <div className={clsx('flex-1 p-3 rounded-lg border', SLOT_COLORS[slot.slotType] || SLOT_COLORS.FREE)}>
            <p className="font-semibold text-sm">{slot.subjectName}</p>
            <p className="text-xs mt-0.5 opacity-80">{slot.division} · {slot.facultyName}</p>
          </div>
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
        </div>
      ))}
    </div>
  )
}
