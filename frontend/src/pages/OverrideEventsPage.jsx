import { useEffect, useState } from 'react'
import { overrideAPI, labsAPI } from '../api'
import { AlertTriangle, PlusCircle, XCircle, CheckCircle2, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const TYPE_LABELS = {
  GLOBAL_EVENT: { label: 'Global Event', desc: 'Affects entire college / all labs', color: 'bg-red-100 text-red-800' },
  LAB_OVERRIDE: { label: 'Lab Override', desc: 'Blocks specific lab(s) for everyone', color: 'bg-orange-100 text-orange-800' },
  CLASS_OVERRIDE: { label: 'Class Override', desc: 'Cancels sessions only for specific divisions', color: 'bg-amber-100 text-amber-800' },
}

const CLUBS = ['PICT ACM', 'PICT IEEE', 'PICT INC']

export default function OverrideEventsPage() {
  const [events, setEvents] = useState([])
  const [labs, setLabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deactivating, setDeactivating] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'CLASS_OVERRIDE',
    overrideDate: '',
    startTime: '09:00',
    endTime: '10:00',
    affectedLabIds: [],
    affectedDepartments: '',
    affectedDivisions: '',
    isMandatory: true,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      overrideAPI.getAll().then(r => setEvents(r.data.data || [])),
      labsAPI.getAll().then(r => setLabs(r.data.data || [])),
    ]).finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleLab = id => setForm(f => ({
    ...f,
    affectedLabIds: f.affectedLabIds.includes(id)
      ? f.affectedLabIds.filter(x => x !== id)
      : [...f.affectedLabIds, id],
  }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.startTime >= form.endTime) { toast.error('End time must be after start time'); return }
    setSubmitting(true)
    try {
      const res = await overrideAPI.create({
        ...form,
        affectedLabIds: form.affectedLabIds.map(Number),
      })
      const created = res.data.data
      toast.success(
        `Override created — ${created.bookingsOverridden} booking(s) and ${created.slotsOverridden} slot(s) overridden`,
        { duration: 6000 }
      )
      setEvents(prev => [created, ...prev])
      setShowForm(false)
      setForm({ title:'', description:'', type:'CLASS_OVERRIDE', overrideDate:'',
        startTime:'09:00', endTime:'10:00', affectedLabIds:[], affectedDepartments:'',
        affectedDivisions:'', isMandatory: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create override event')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async id => {
    if (!confirm('Deactivate this override? Affected slots and bookings will be restored.')) return
    setDeactivating(id)
    try {
      const res = await overrideAPI.deactivate(id)
      toast.success('Override deactivated — slots and bookings restored')
      setEvents(prev => prev.map(e => e.id === id ? { ...e, isActive: false } : e))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate')
    } finally {
      setDeactivating(null)
    }
  }

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate())
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Override Events</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create mandatory events that supersede lab schedules and bookings
          </p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          {showForm ? 'Cancel' : 'New Override'}
        </button>
      </div>

      {/* Info box */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-blue-800 space-y-1">
          <p className="font-semibold">How Override Events Work</p>
          <p>Creating an override event will:</p>
          <ul className="list-disc list-inside text-xs space-y-0.5 text-blue-700">
            <li>Mark affected timetable slots as <strong>OVERRIDDEN</strong> (shown in red on schedule)</li>
            <li>Change affected approved/pending bookings to <strong>OVERRIDDEN</strong> status</li>
            <li>Block new bookings from affected divisions during the window</li>
            <li>Professors can still book for <em>unaffected</em> divisions</li>
          </ul>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-primary-200 p-6 space-y-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" /> Create Override Event
          </h2>

          {/* Type selection */}
          <div>
            <label className="label">Override Type *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(TYPE_LABELS).map(([val, { label, desc, color }]) => (
                <button key={val} type="button" onClick={() => set('type', val)}
                  className={clsx('p-3 rounded-xl border-2 text-left transition-all',
                    form.type === val ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300')}>
                  <span className={clsx('text-xs font-bold px-1.5 py-0.5 rounded', color)}>{label}</span>
                  <p className="text-xs text-gray-500 mt-1">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Title + Description */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="label">Event Title *</label>
              <input className="input-field" required value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. Compulsory Guest Lecture — Auditorium" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input-field h-20 resize-none" value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Details about why this override is needed…" />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input-field" required min={minDate}
                value={form.overrideDate} onChange={e => set('overrideDate', e.target.value)} />
            </div>
            <div>
              <label className="label">Start Time *</label>
              <input type="time" className="input-field" required
                value={form.startTime} onChange={e => set('startTime', e.target.value)} />
            </div>
            <div>
              <label className="label">End Time *</label>
              <input type="time" className="input-field" required
                value={form.endTime} onChange={e => set('endTime', e.target.value)} />
            </div>
          </div>

          {/* Affected Labs (for LAB_OVERRIDE and CLASS_OVERRIDE) */}
          {(form.type === 'LAB_OVERRIDE' || form.type === 'CLASS_OVERRIDE') && (
            <div>
              <label className="label">Affected Labs (leave empty for all labs)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {labs.map(lab => (
                  <button key={lab.id} type="button" onClick={() => toggleLab(lab.id)}
                    className={clsx('p-2.5 rounded-lg border text-sm text-left transition-all',
                      form.affectedLabIds.includes(lab.id)
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300')}>
                    <p className="font-semibold">{lab.roomNumber}</p>
                    <p className="text-xs opacity-70">{lab.labName}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Affected Divisions (for CLASS_OVERRIDE) */}
          {form.type === 'CLASS_OVERRIDE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Affected Divisions (comma-separated)</label>
                <input className="input-field" value={form.affectedDivisions}
                  onChange={e => set('affectedDivisions', e.target.value)}
                  placeholder="e.g. TE-A,TE-B,SE-A (empty = all divisions)" />
                <p className="text-xs text-gray-400 mt-1">Leave empty to affect all divisions</p>
              </div>
              <div>
                <label className="label">Affected Departments</label>
                <input className="input-field" value={form.affectedDepartments}
                  onChange={e => set('affectedDepartments', e.target.value)}
                  placeholder="e.g. Computer Engineering" />
              </div>
            </div>
          )}

          {/* Mandatory toggle */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set('isMandatory', !form.isMandatory)}
              className={clsx('relative w-11 h-6 rounded-full transition-colors',
                form.isMandatory ? 'bg-red-500' : 'bg-gray-300')}>
              <span className={clsx('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                form.isMandatory ? 'translate-x-6' : 'translate-x-1')} />
            </button>
            <label className="text-sm font-medium text-gray-700">
              Mark as Mandatory (students cannot opt out)
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50">
              {submitting ? 'Creating Override…' : '🚫 Create Override Event'}
            </button>
          </div>
        </form>
      )}

      {/* Events List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No override events</p>
          <p className="text-gray-400 text-sm mt-1">All schedules are running normally</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <OverrideEventCard
              key={event.id}
              event={event}
              expanded={expandedId === event.id}
              onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
              onDeactivate={() => handleDeactivate(event.id)}
              deactivating={deactivating === event.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function OverrideEventCard({ event, expanded, onToggle, onDeactivate, deactivating }) {
  const typeInfo = TYPE_LABELS[event.type] || { label: event.type, color: 'bg-gray-100 text-gray-700' }

  return (
    <div className={clsx('bg-white rounded-xl border transition-all',
      event.isActive ? 'border-red-200 shadow-sm' : 'border-gray-200 opacity-70')}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {event.isActive
                ? <AlertTriangle className="w-4 h-4 text-red-500" />
                : <CheckCircle2 className="w-4 h-4 text-green-500" />}
              <h3 className="font-bold text-gray-900 truncate">{event.title}</h3>
              <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', typeInfo.color)}>
                {typeInfo.label}
              </span>
              {event.isMandatory && event.isActive && (
                <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-medium">MANDATORY</span>
              )}
              {!event.isActive && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Deactivated</span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>📅 {event.overrideDate}</span>
              <span>🕐 {event.startTime} – {event.endTime}</span>
              {event.affectedLabs?.length > 0 && (
                <span>🏛 {event.affectedLabs.map(l => l.roomNumber).join(', ')}</span>
              )}
              {event.affectedDivisions && <span>👥 {event.affectedDivisions}</span>}
            </div>

            {event.description && (
              <p className="text-sm text-gray-500 mt-2 italic">{event.description}</p>
            )}

            <p className="text-xs text-gray-400 mt-2">
              Created by <strong className="text-gray-600">{event.createdBy?.fullName}</strong>
              {event.createdAt && ` · ${format(new Date(event.createdAt), 'dd MMM yyyy, HH:mm')}`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {event.isActive && (
              <button onClick={onDeactivate} disabled={deactivating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                <XCircle className="w-4 h-4" />
                {deactivating ? '…' : 'Deactivate'}
              </button>
            )}
            <button onClick={onToggle}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 font-medium">Bookings Overridden</p>
              <p className="text-lg font-bold text-red-600">{event.bookingsOverridden ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Slots Overridden</p>
              <p className="text-lg font-bold text-orange-600">{event.slotsOverridden ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Priority Level</p>
              <p className="text-lg font-bold text-gray-700">{event.priorityLevel}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Departments</p>
              <p className="text-sm text-gray-700">{event.affectedDepartments || 'All'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
