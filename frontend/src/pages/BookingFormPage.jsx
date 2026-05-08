import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingsAPI, labsAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
<<<<<<< HEAD
import { PlusCircle, FlaskConical, Info, AlertCircle } from 'lucide-react'

const CLUBS = ['PICT ACM', 'PICT IEEE', 'PICT INC']
const TIME_SLOTS = [
  '08:00','09:00','09:15','10:00','10:15','11:00','11:30',
  '12:00','12:30','13:00','14:00','15:00','15:15','16:00','17:00','18:00'
]

export default function BookingFormPage() {
  const { user, hasAnyRole } = useAuth()
  const navigate = useNavigate()
  const [labs, setLabs] = useState([])
  const [loading, setLoading] = useState(false)

  const isFaculty = hasAnyRole('PROFESSOR', 'CLASS_COORDINATOR')
  const isStudent = hasAnyRole('STUDENT')
  const isClubManager = hasAnyRole('CLUB_MANAGER')

  // Set sensible default request type per role
  const defaultType = isFaculty ? 'EXTRA_CLASS' : isClubManager ? 'CLUB_EVENT' : 'EXTRA_CLASS'

  const [form, setForm] = useState({
    requestType: defaultType,
    bookingDate: '',
    startTime: '09:00',
    endTime: '10:00',
=======
import { PlusCircle, FlaskConical, Info } from 'lucide-react'

const CLUBS = ['PICT ACM', 'PICT IEEE', 'PICT INC']
const TIME_SLOTS = [
  '08:00','09:15','10:15','11:30','12:30','14:00','15:00','16:00','17:00'
]

export default function BookingFormPage() {
  const { user, hasRole } = useAuth()
  const navigate = useNavigate()
  const [labs, setLabs] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    requestType: 'EXTRA_CLASS',
    bookingDate: '',
    startTime: '09:15',
    endTime: '10:15',
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
    purpose: '',
    expectedAttendees: '',
    clubName: user?.clubName ?? '',
    eventName: '',
    additionalRequirements: '',
    labIds: [],
    division: user?.division ?? '',
  })

  useEffect(() => {
<<<<<<< HEAD
    labsAPI.getAll().then(r => setLabs(r.data.data || [])).catch(() => {})
=======
    labsAPI.getAll().then(r => setLabs(r.data.data)).catch(() => {})
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleLab = id => {
    const multi = form.requestType === 'MULTI_LAB_EVENT'
    setForm(f => {
      const ids = f.labIds.includes(id)
        ? f.labIds.filter(x => x !== id)
        : multi ? [...f.labIds, id] : [id]
      return { ...f, labIds: ids }
    })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.labIds.length) { toast.error('Select at least one lab'); return }
    if (form.startTime >= form.endTime) { toast.error('End time must be after start time'); return }
<<<<<<< HEAD
    if (!form.bookingDate) { toast.error('Select a booking date'); return }

=======
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
    setLoading(true)
    try {
      const payload = {
        ...form,
        expectedAttendees: form.expectedAttendees ? Number(form.expectedAttendees) : null,
        labIds: form.labIds.map(Number),
      }
      const r = await bookingsAPI.submit(payload)
      toast.success(`Booking submitted! Ref: ${r.data.data.referenceNumber}`)
      navigate('/my-bookings')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const isClub = form.requestType === 'CLUB_EVENT' || form.requestType === 'MULTI_LAB_EVENT'
  const isExtra = form.requestType === 'EXTRA_CLASS'

<<<<<<< HEAD
  // Today (not tomorrow — professors may need to book same day)
  const today = new Date().toISOString().split('T')[0]

  // Request types available per role
  const requestTypes = [
    ...(isStudent || isFaculty
      ? [{ value: 'EXTRA_CLASS', label: 'Extra Class', desc: isFaculty ? 'Extra faculty session' : 'Extra lab session for a class' }]
      : []),
    ...(isClubManager || isFaculty
      ? [{ value: 'CLUB_EVENT', label: 'Club Event', desc: 'Club meeting or workshop' }]
      : []),
    ...(!isStudent
      ? [{ value: 'MULTI_LAB_EVENT', label: 'Multi-Lab Event', desc: 'Hackathon or large event' }]
      : [{ value: 'MULTI_LAB_EVENT', label: 'Multi-Lab Event', desc: 'Large multi-lab event' }]),
  ]
=======
  // Minimum date: tomorrow
  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <PlusCircle className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book a Lab</h1>
<<<<<<< HEAD
          <p className="text-gray-500 text-sm">
            {isFaculty ? 'Submit a faculty lab booking request' : 'Submit a lab booking request for approval'}
          </p>
        </div>
      </div>

      {isFaculty && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>As a faculty member, your booking will go to <strong>Lab Assistant → HOD</strong> for approval.</p>
        </div>
      )}

=======
          <p className="text-gray-500 text-sm">Submit a lab booking request for approval</p>
        </div>
      </div>

>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Type */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Request Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
<<<<<<< HEAD
            {requestTypes.map(opt => (
=======
            {[
              { value: 'EXTRA_CLASS',    label: 'Extra Class',    desc: 'Extra lab session for a class' },
              { value: 'CLUB_EVENT',     label: 'Club Event',     desc: 'Club meeting or workshop' },
              { value: 'MULTI_LAB_EVENT',label: 'Multi-Lab Event',desc: 'Hackathon or large event' },
            ].map(opt => (
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
              <button key={opt.value} type="button"
                onClick={() => { set('requestType', opt.value); set('labIds', []) }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  form.requestType === opt.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                <p className="font-medium text-sm text-gray-800">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Lab Selection */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-1">Select Lab(s)</h2>
          {form.requestType === 'MULTI_LAB_EVENT' && (
            <p className="text-xs text-blue-600 mb-3 flex items-center gap-1">
              <Info className="w-3 h-3" /> You can select multiple labs for a multi-lab event
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            {labs.map(lab => (
              <button key={lab.id} type="button"
                onClick={() => toggleLab(lab.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  form.labIds.includes(lab.id)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                <div className="flex items-center gap-2">
                  <FlaskConical className={`w-5 h-5 ${form.labIds.includes(lab.id) ? 'text-primary-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium text-sm">{lab.roomNumber}</p>
                    <p className="text-xs text-gray-500">{lab.labName} · {lab.capacity} seats</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {lab.hasProjector && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Projector</span>}
                  {lab.hasAc && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">AC</span>}
                </div>
              </button>
            ))}
          </div>
<<<<<<< HEAD
          {!labs.length && (
            <p className="text-sm text-gray-400 text-center py-4">Loading labs…</p>
          )}
=======
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
        </div>

        {/* Date & Time */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Date & Time</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
<<<<<<< HEAD
              <label className="label">Date *</label>
              <input type="date" className="input-field" required
                min={today}
                value={form.bookingDate}
                onChange={e => set('bookingDate', e.target.value)} />
            </div>
            <div>
              <label className="label">Start Time *</label>
              <select className="input-field" value={form.startTime}
                onChange={e => set('startTime', e.target.value)}>
                {TIME_SLOTS.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">End Time *</label>
=======
              <label className="label">Date</label>
              <input type="date" className="input-field" required
                min={minDateStr}
                value={form.bookingDate} onChange={e => set('bookingDate', e.target.value)} />
            </div>
            <div>
              <label className="label">Start Time</label>
              <select className="input-field" value={form.startTime}
                onChange={e => set('startTime', e.target.value)}>
                {TIME_SLOTS.slice(0,-1).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">End Time</label>
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
              <select className="input-field" value={form.endTime}
                onChange={e => set('endTime', e.target.value)}>
                {TIME_SLOTS.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800">Details</h2>
          <div>
            <label className="label">Purpose *</label>
            <textarea className="input-field" rows={3} required
<<<<<<< HEAD
              placeholder="Describe the purpose of this booking…"
=======
              placeholder="Describe the purpose of this booking..."
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
              value={form.purpose} onChange={e => set('purpose', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Expected Attendees</label>
              <input type="number" className="input-field" min={1}
                value={form.expectedAttendees}
                onChange={e => set('expectedAttendees', e.target.value)}
                placeholder="e.g. 50" />
            </div>
            {isExtra && (
              <div>
<<<<<<< HEAD
                <label className="label">Division {isFaculty ? '(optional)' : ''}</label>
=======
                <label className="label">Division</label>
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
                <input className="input-field" value={form.division}
                  onChange={e => set('division', e.target.value)}
                  placeholder="e.g. TE-A" />
              </div>
            )}
          </div>

          {isClub && (
<<<<<<< HEAD
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Club Name *</label>
                <select className="input-field" value={form.clubName}
                  onChange={e => set('clubName', e.target.value)} required={isClub}>
                  <option value="">Select club</option>
                  {CLUBS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Event Name *</label>
                <input className="input-field" required={isClub}
                  value={form.eventName} onChange={e => set('eventName', e.target.value)}
                  placeholder="e.g. ACM Tech Talk 2024" />
              </div>
            </div>
=======
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Club Name *</label>
                  <select className="input-field" value={form.clubName}
                    onChange={e => set('clubName', e.target.value)} required={isClub}>
                    <option value="">Select club</option>
                    {CLUBS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Event Name *</label>
                  <input className="input-field" required={isClub}
                    value={form.eventName} onChange={e => set('eventName', e.target.value)}
                    placeholder="e.g. ACM Tech Talk 2024" />
                </div>
              </div>
            </>
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
          )}

          <div>
            <label className="label">Additional Requirements</label>
            <textarea className="input-field" rows={2}
<<<<<<< HEAD
              placeholder="Any special requirements (e.g. need whiteboard, extra chairs)…"
=======
              placeholder="Any special requirements (e.g. need whiteboard, extra chairs)..."
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
              value={form.additionalRequirements}
              onChange={e => set('additionalRequirements', e.target.value)} />
          </div>
        </div>

        {/* Approval Flow Info */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Approval Workflow</h3>
<<<<<<< HEAD
          {isExtra && !isFaculty && (
            <p className="text-xs text-blue-700">
              <strong>Lab Assistant → Professor → Class Coordinator</strong>.
              {' '}Approval by Professor or Class Coordinator auto-approves the request.
            </p>
          )}
          {isExtra && isFaculty && (
            <p className="text-xs text-blue-700">
              As faculty, your request goes to <strong>Lab Assistant → HOD</strong>.
            </p>
          )}
          {isClub && (
            <p className="text-xs text-blue-700">
              <strong>Lab Assistant → Club Coordinator → Professor → HOD → Principal</strong>.
              {' '}Higher authority approval auto-approves lower levels.
=======
          {isExtra ? (
            <p className="text-xs text-blue-700">
              Your request will be reviewed by: <strong>Lab Assistant → Professor → Class Coordinator</strong>.
              Approval by Professor or Class Coordinator auto-approves the request.
            </p>
          ) : (
            <p className="text-xs text-blue-700">
              Your request will follow the hierarchy: <strong>Lab Assistant → Club Coordinator → Professor → HOD → Principal</strong>.
              Higher authority approval auto-approves lower levels.
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
