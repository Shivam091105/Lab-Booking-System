import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingsAPI } from '../api'
import StatusBadge from '../components/common/StatusBadge'
import { CheckSquare, CheckCircle2, XCircle, Eye, Clock, Calendar, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const TYPE_LABELS = {
  EXTRA_CLASS: 'Extra Class',
  CLUB_EVENT: 'Club Event',
  MULTI_LAB_EVENT: 'Multi-Lab Event',
}

export default function ApprovalPanelPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionModal, setActionModal] = useState(null) // { booking, action: 'APPROVED'|'REJECTED' }
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchPending() }, [])

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await bookingsAPI.getPendingForRole()
      setBookings(res.data.data || [])
    } catch {
      toast.error('Failed to load pending approvals')
    } finally {
      setLoading(false)
    }
  }

  const openAction = (booking, action) => {
    setActionModal({ booking, action })
    setComment('')
  }

  const submitAction = async () => {
    if (!actionModal) return
    if (actionModal.action === 'REJECTED' && !comment.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    setSubmitting(true)
    try {
      await bookingsAPI.approve(actionModal.booking.id, {
        action: actionModal.action,
        comments: comment,
      })
      toast.success(actionModal.action === 'APPROVED' ? 'Booking approved!' : 'Booking rejected')
      setActionModal(null)
      fetchPending()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approval Panel</h1>
        <p className="text-gray-500 text-sm mt-1">
          Review and act on lab booking requests pending your approval
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{bookings.length}</p>
          <p className="text-sm text-yellow-600">Pending</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">—</p>
          <p className="text-sm text-green-600">Approved Today</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">—</p>
          <p className="text-sm text-red-600">Rejected Today</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium text-lg">All caught up!</p>
          <p className="text-gray-400 text-sm mt-1">No pending approvals for your role</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <ApprovalCard
              key={booking.id}
              booking={booking}
              onApprove={() => openAction(booking, 'APPROVED')}
              onReject={() => openAction(booking, 'REJECTED')}
            />
          ))}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className={clsx(
              'flex items-center gap-3 mb-5',
              actionModal.action === 'APPROVED' ? 'text-green-700' : 'text-red-700'
            )}>
              {actionModal.action === 'APPROVED'
                ? <CheckCircle2 className="w-6 h-6" />
                : <XCircle className="w-6 h-6" />}
              <h2 className="text-lg font-bold">
                {actionModal.action === 'APPROVED' ? 'Approve' : 'Reject'} Request
              </h2>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
              <p className="font-semibold text-gray-900">{actionModal.booking.referenceNumber}</p>
              <p className="text-gray-600 mt-1">{actionModal.booking.purpose}</p>
              <p className="text-gray-500 text-xs mt-1">
                {actionModal.booking.bookingDate} · {actionModal.booking.labs?.map(l => l.roomNumber).join(', ')}
              </p>
            </div>

            <div className="mb-4">
              <label className="label">
                Comments {actionModal.action === 'REJECTED' ? '(required)' : '(optional)'}
              </label>
              <textarea
                className="input-field h-24 resize-none"
                placeholder={actionModal.action === 'REJECTED'
                  ? 'Provide a reason for rejection…'
                  : 'Add any comments (optional)…'}
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActionModal(null)}
                className="flex-1 btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                disabled={submitting}
                className={clsx(
                  'flex-1 py-2.5 rounded-lg font-medium text-white transition-colors disabled:opacity-50',
                  actionModal.action === 'APPROVED'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                )}
              >
                {submitting ? 'Processing…' : actionModal.action === 'APPROVED' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ApprovalCard({ booking, onApprove, onReject }) {
  // Find the next pending step that matches this role's turn
  const nextPending = booking.approvals?.find(a => a.status === 'PENDING')

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Top */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-sm font-semibold text-primary-600">{booking.referenceNumber}</span>
            <StatusBadge status={booking.status} />
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {TYPE_LABELS[booking.requestType]}
            </span>
            {nextPending && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                Awaiting: {nextPending.approverRole?.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          <p className="text-gray-800 font-medium truncate">{booking.purpose}</p>

          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {booking.bookingDate ? format(new Date(booking.bookingDate), 'dd MMM yyyy') : '—'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {booking.startTime} – {booking.endTime}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {booking.labs?.map(l => l.roomNumber).join(', ')}
            </span>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Requested by <strong className="text-gray-600">{booking.requester?.fullName}</strong>
            {booking.requester?.division && ` · ${booking.requester.division}`}
            {booking.clubName && ` · ${booking.clubName}`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/bookings/${booking.id}`}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button
            onClick={onApprove}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve
          </button>
        </div>
      </div>
    </div>
  )
}
