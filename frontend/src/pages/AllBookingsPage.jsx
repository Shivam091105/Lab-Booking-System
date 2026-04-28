import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingsAPI } from '../api'
import StatusBadge from '../components/common/StatusBadge'
import { BookOpen, Eye, Search, Filter, Download } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const TYPE_LABELS = {
  EXTRA_CLASS: 'Extra Class',
  CLUB_EVENT: 'Club Event',
  MULTI_LAB_EVENT: 'Multi-Lab Event',
}

const STATUSES = ['ALL', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED']

export default function AllBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  useEffect(() => {
    bookingsAPI.getAll()
      .then(res => {
        const data = [...(res.data.data || [])].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
        setBookings(data)
        setFiltered(data)
      })
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = bookings
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(b =>
        b.referenceNumber?.toLowerCase().includes(q) ||
        b.purpose?.toLowerCase().includes(q) ||
        b.requester?.fullName?.toLowerCase().includes(q) ||
        b.labs?.some(l => l.roomNumber?.toLowerCase().includes(q))
      )
    }
    if (statusFilter !== 'ALL') result = result.filter(b => b.status === statusFilter)
    if (typeFilter !== 'ALL') result = result.filter(b => b.requestType === typeFilter)
    setFiltered(result)
  }, [search, statusFilter, typeFilter, bookings])

  // Summary counts
  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">System-wide view of all lab booking requests</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(counts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? 'ALL' : status)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all
              ${statusFilter === status ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}
          >
            {status.replace(/_/g, ' ')} · {count}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Search by ref, purpose, requester or lab…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s.replace(/_/g, ' ')}</option>)}
        </select>
        <select className="input-field w-44" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="ALL">All Types</option>
          <option value="EXTRA_CLASS">Extra Class</option>
          <option value="CLUB_EVENT">Club Event</option>
          <option value="MULTI_LAB_EVENT">Multi-Lab Event</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Reference', 'Requester', 'Type', 'Date', 'Time', 'Lab(s)', 'Status', 'Submitted', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-gray-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>No bookings found</p>
                    </td>
                  </tr>
                ) : filtered.map(booking => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-primary-600">
                        {booking.referenceNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 whitespace-nowrap">{booking.requester?.fullName}</p>
                      <p className="text-xs text-gray-400">{booking.requester?.email}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[booking.requestType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {booking.bookingDate ? format(new Date(booking.bookingDate), 'dd MMM yy') : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-xs">
                      {booking.startTime} – {booking.endTime}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">
                        {booking.labs?.map(l => l.roomNumber).join(', ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {booking.createdAt ? format(new Date(booking.createdAt), 'dd MMM, HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/bookings/${booking.id}`}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors inline-flex"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {filtered.length} of {bookings.length} bookings
          </div>
        </div>
      )}
    </div>
  )
}
