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
      .catch(() => toast.error('Failed to load timetable'))
      .finally(() => setLoading(false))
  }, [selectedLab])

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
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-primary-600" />
                <span className="font-semibold text-gray-900 text-sm">{lab.roomNumber}</span>
              </div>
              <p className="text-xs text-gray-600 truncate">{lab.labName}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <Users className="w-3 h-3" /> {lab.capacity}
                {lab.hasProjector && <><Monitor className="w-3 h-3 ml-1" /> Projector</>}
                {lab.hasAc && <><Wind className="w-3 h-3 ml-1" /> AC</>}
              </div>
            </button>
          ))}
        </div>

        {/* Timetable */}
        <div className="lg:col-span-3">
          {/* Controls */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
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
                    {v}
                  </button>
                ))}
              </div>
            </div>

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
              </div>
            )}
          </div>

          {loading ? (
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
        </div>
      </div>
    </div>
  )
}

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
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

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
        </div>
      ))}
    </div>
  )
}
