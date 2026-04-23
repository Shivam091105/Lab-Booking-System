import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingsAPI, labsAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
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
    purpose: '',
    expectedAttendees: '',
    clubName: user?.clubName ?? '',
    eventName: '',
    additionalRequirements: '',
    labIds: [],
    division: user?.division ?? '',
  })

  useEffect(() => {
    labsAPI.getAll().then(r => setLabs(r.data.data)).catch(() => {})
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

  // Minimum date: tomorrow
  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <PlusCircle className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book a Lab</h1>
          <p className="text-gray-500 text-sm">Submit a lab booking request for approval</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Type */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Request Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: 'EXTRA_CLASS',    label: 'Extra Class',    desc: 'Extra lab session for a class' },
              { value: 'CLUB_EVENT',     label: 'Club Event',     desc: 'Club meeting or workshop' },
              { value: 'MULTI_LAB_EVENT',label: 'Multi-Lab Event',desc: 'Hackathon or large event' },
            ].map(opt => (
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
        </div>

        {/* Date & Time */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Date & Time</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
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
              placeholder="Describe the purpose of this booking..."
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
                <label className="label">Division</label>
                <input className="input-field" value={form.division}
                  onChange={e => set('division', e.target.value)}
                  placeholder="e.g. TE-A" />
              </div>
            )}
          </div>

          {isClub && (
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
          )}

          <div>
            <label className="label">Additional Requirements</label>
            <textarea className="input-field" rows={2}
              placeholder="Any special requirements (e.g. need whiteboard, extra chairs)..."
              value={form.additionalRequirements}
              onChange={e => set('additionalRequirements', e.target.value)} />
          </div>
        </div>

        {/* Approval Flow Info */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Approval Workflow</h3>
          {isExtra ? (
            <p className="text-xs text-blue-700">
              Your request will be reviewed by: <strong>Lab Assistant → Professor → Class Coordinator</strong>.
              Approval by Professor or Class Coordinator auto-approves the request.
            </p>
          ) : (
            <p className="text-xs text-blue-700">
              Your request will follow the hierarchy: <strong>Lab Assistant → Club Coordinator → Professor → HOD → Principal</strong>.
              Higher authority approval auto-approves lower levels.
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
