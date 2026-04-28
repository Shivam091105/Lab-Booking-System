import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingsAPI } from '../api'
import StatusBadge from '../components/common/StatusBadge'
import { ClipboardList, Eye, XCircle, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const REQUEST_TYPE_LABELS = {
  EXTRA_CLASS: 'Extra Class',
  CLUB_EVENT: 'Club Event',
  MULTI_LAB_EVENT: 'Multi-Lab Event',
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [cancelling, setCancelling] = useState(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    let result = bookings
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(b =>
        b.referenceNumber?.toLowerCase().includes(q) ||
        b.purpose?.toLowerCase().includes(q) ||
        b.labs?.some(l => l.roomNumber?.toLowerCase().includes(q))
      )
    }
    if (statusFilter !== 'ALL') {
      result = result.filter(b => b.status === statusFilter)
    }
    setFiltered(result)
  }, [search, statusFilter, bookings])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const res = await bookingsAPI.getMyBookings()
      const sorted = [...(res.data.data || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
      setBookings(sorted)
      setFiltered(sorted)
    } catch {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking request?')) return
    setCancelling(id)
    try {
      await bookingsAPI.cancel(id)
      toast.success('Booking cancelled')
      fetchBookings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking')
    } finally {
      setCancelling(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">Track all your lab booking requests</p>
        </div>
        <Link to="/book" className="btn-primary flex items-center gap-2">
          + New Request
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Search by reference, purpose or lab…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="input-field w-40"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No bookings found</p>
          <p className="text-gray-400 text-sm mt-1">Submit your first lab booking request</p>
          <Link to="/book" className="btn-primary inline-flex mt-4">Book a Lab</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(booking => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={handleCancel}
              cancelling={cancelling === booking.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking, onCancel, cancelling }) {
  const canCancel = ['PENDING', 'IN_REVIEW'].includes(booking.status)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-semibold text-primary-600">
              {booking.referenceNumber}
            </span>
            <StatusBadge status={booking.status} />
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {REQUEST_TYPE_LABELS[booking.requestType] || booking.requestType}
            </span>
          </div>

          {/* Purpose */}
          <p className="text-gray-800 font-medium mt-2 truncate">{booking.purpose}</p>

          {/* Details row */}
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
            <span>
              📅 {booking.bookingDate
                ? format(new Date(booking.bookingDate), 'dd MMM yyyy')
                : '—'}
            </span>
            <span>
              🕐 {booking.startTime} – {booking.endTime}
            </span>
            <span>
              🏛 {booking.labs?.map(l => l.roomNumber).join(', ') || '—'}
            </span>
            <span>
              🕒 Submitted {booking.createdAt
                ? format(new Date(booking.createdAt), 'dd MMM, HH:mm')
                : '—'}
            </span>
          </div>

          {/* Approval progress */}
          {booking.approvals?.length > 0 && (
            <ApprovalProgress approvals={booking.approvals} />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/bookings/${booking.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
          >
            <Eye className="w-4 h-4" /> View
          </Link>
          {canCancel && (
            <button
              onClick={() => onCancel(booking.id)}
              disabled={cancelling}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              {cancelling ? '…' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ApprovalProgress({ approvals }) {
  const STATUS_COLORS = {
    PENDING: 'bg-gray-200',
    APPROVED: 'bg-green-500',
    REJECTED: 'bg-red-500',
    SKIPPED: 'bg-blue-300',
  }

  return (
    <div className="mt-3 flex items-center gap-1.5">
      <span className="text-xs text-gray-400 mr-1">Approvals:</span>
      {approvals.map((a, i) => (
        <div key={a.id} className="flex items-center gap-1">
          <div
            className={clsx('w-2.5 h-2.5 rounded-full', STATUS_COLORS[a.status] || 'bg-gray-200')}
            title={`${a.approverRole}: ${a.status}`}
          />
          {i < approvals.length - 1 && <div className="w-4 h-px bg-gray-200" />}
        </div>
      ))}
    </div>
  )
}
