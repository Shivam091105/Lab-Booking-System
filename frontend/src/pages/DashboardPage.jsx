import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { bookingsAPI } from '../api'
import StatusBadge from '../components/common/StatusBadge'
import {
  ClipboardList, CheckSquare, Clock, XCircle,
  PlusCircle, FlaskConical, TrendingUp, Users
} from 'lucide-react'
import { format } from 'date-fns'

function StatCard({ icon: Icon, label, value, color, to }) {
  const card = (
    <div className={`card hover:shadow-md transition-shadow flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
  return to ? <Link to={to}>{card}</Link> : card
}

export default function DashboardPage() {
  const { user, hasAnyRole } = useAuth()
  const [myBookings, setMyBookings] = useState([])
  const [pending, setPending] = useState([])
  const [statusCounts, setStatusCounts] = useState({})
  const [loading, setLoading] = useState(true)

  const isApprover = hasAnyRole('LAB_ASSISTANT','PROFESSOR','CLASS_COORDINATOR','HOD','PRINCIPAL','CLUB_MANAGER')
  const isRequester = hasAnyRole('STUDENT','CLUB_MANAGER')
  const isAdmin = hasAnyRole('HOD','PRINCIPAL')

  useEffect(() => {
    const load = async () => {
      try {
        if (isRequester) {
          const r = await bookingsAPI.getMyBookings()
          setMyBookings(r.data.data)
        }
        if (isApprover) {
          const r = await bookingsAPI.getPendingForRole()
          setPending(r.data.data)
        }
        if (isAdmin) {
          const r = await bookingsAPI.getStatusCounts()
          setStatusCounts(r.data.data)
        }
      } catch { /* handled globally */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const myApproved  = myBookings.filter(b => b.status === 'APPROVED').length
  const myPending   = myBookings.filter(b => b.status === 'PENDING' || b.status === 'IN_REVIEW').length
  const myRejected  = myBookings.filter(b => b.status === 'REJECTED').length

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-[#003580] to-[#1d4ed8] rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Welcome, {user?.fullName}!</h2>
        <p className="text-blue-200 mt-1 capitalize">
          {user?.roles?.map(r => r.replace('_', ' ')).join(' • ')} Dashboard
        </p>
        <p className="text-blue-100 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Admin stats */}
      {isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={ClipboardList} label="Total Requests"
            value={Object.values(statusCounts).reduce((a,b) => a+b, 0)}
            color="bg-blue-500" to="/all-bookings" />
          <StatCard icon={CheckSquare}  label="Approved"  value={statusCounts.APPROVED}  color="bg-green-500" />
          <StatCard icon={Clock}        label="Pending"   value={(statusCounts.PENDING ?? 0) + (statusCounts.IN_REVIEW ?? 0)} color="bg-yellow-500" to="/approvals" />
          <StatCard icon={XCircle}      label="Rejected"  value={statusCounts.REJECTED}  color="bg-red-500" />
        </div>
      )}

      {/* Requester stats */}
      {isRequester && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={ClipboardList} label="My Bookings" value={myBookings.length}
            color="bg-blue-500" to="/my-bookings" />
          <StatCard icon={CheckSquare}   label="Approved"  value={myApproved}  color="bg-green-500" />
          <StatCard icon={Clock}         label="In Review" value={myPending}   color="bg-yellow-500" />
        </div>
      )}

      {/* Approver pending */}
      {isApprover && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary-600" />
              Pending Your Approval
              {pending.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pending.length}
                </span>
              )}
            </h3>
            <Link to="/approvals" className="text-sm text-primary-600 hover:underline">View all →</Link>
          </div>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : pending.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 5).map(b => (
                <Link key={b.id} to={`/bookings/${b.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{b.referenceNumber}</p>
                    <p className="text-xs text-gray-500">{b.requester?.fullName} · {b.requestType?.replace('_',' ')}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={b.status} />
                    <p className="text-xs text-gray-400 mt-1">{b.bookingDate}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hasAnyRole('STUDENT','CLUB_MANAGER') && (
          <Link to="/book"
            className="card hover:shadow-md transition-shadow flex items-center gap-4 cursor-pointer border-2 border-dashed border-primary-200 hover:border-primary-400">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
              <PlusCircle className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Book a Lab</p>
              <p className="text-sm text-gray-500">Submit a new lab booking request</p>
            </div>
          </Link>
        )}
        <Link to="/schedule"
          className="card hover:shadow-md transition-shadow flex items-center gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <FlaskConical className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">View Lab Schedule</p>
            <p className="text-sm text-gray-500">Check lab availability and timetable</p>
          </div>
        </Link>
      </div>

      {/* Recent bookings (requester) */}
      {isRequester && myBookings.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Requests</h3>
            <Link to="/my-bookings" className="text-sm text-primary-600 hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Reference</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myBookings.slice(0, 5).map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="py-2.5">
                      <Link to={`/bookings/${b.id}`} className="text-primary-600 font-medium hover:underline">
                        {b.referenceNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 text-gray-600">{b.requestType?.replace('_',' ')}</td>
                    <td className="py-2.5 text-gray-600">{b.bookingDate}</td>
                    <td className="py-2.5"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
