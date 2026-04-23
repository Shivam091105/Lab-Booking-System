import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { bookingsAPI } from '../api'
import StatusBadge from '../components/common/StatusBadge'
import { ArrowLeft, Calendar, Clock, MapPin, Users, FileText, CheckCircle2, XCircle, Circle, SkipForward } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const ROLE_LABELS = {
  LAB_ASSISTANT: 'Lab Assistant',
  PROFESSOR: 'Professor',
  CLASS_COORDINATOR: 'Class Coordinator',
  CLUB_MANAGER: 'Club Coordinator',
  HOD: 'Head of Department',
  PRINCIPAL: 'Principal',
}

const TYPE_LABELS = {
  EXTRA_CLASS: 'Extra Class Session',
  CLUB_EVENT: 'Club Event',
  MULTI_LAB_EVENT: 'Multi-Lab Event',
}

export default function BookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    bookingsAPI.getById(id)
      .then(res => setBooking(res.data.data))
      .catch(() => { toast.error('Booking not found'); navigate('/my-bookings') })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )

  if (!booking) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{booking.referenceNumber}</h1>
            <StatusBadge status={booking.status} size="md" />
          </div>
          <p className="text-gray-500 text-sm">{TYPE_LABELS[booking.requestType]}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Booking Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date">
                {format(new Date(booking.bookingDate), 'EEEE, dd MMM yyyy')}
              </InfoRow>
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Time">
                {booking.startTime} – {booking.endTime}
              </InfoRow>
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Labs">
                {booking.labs?.map(l => l.roomNumber).join(', ')}
              </InfoRow>
              <InfoRow icon={<Users className="w-4 h-4" />} label="Attendees">
                {booking.expectedAttendees ?? '—'}
              </InfoRow>
              <InfoRow icon={<FileText className="w-4 h-4" />} label="Purpose" className="col-span-2">
                {booking.purpose}
              </InfoRow>
              {booking.division && (
                <InfoRow label="Division" className="col-span-2">{booking.division}</InfoRow>
              )}
              {booking.clubName && (
                <InfoRow label="Club">{booking.clubName}</InfoRow>
              )}
              {booking.eventName && (
                <InfoRow label="Event Name">{booking.eventName}</InfoRow>
              )}
              {booking.additionalRequirements && (
                <InfoRow label="Additional Requirements" className="col-span-2">
                  {booking.additionalRequirements}
                </InfoRow>
              )}
            </div>

            {booking.rejectionReason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-700">Rejection Reason</p>
                <p className="text-sm text-red-600 mt-1">{booking.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Requester info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Requested By</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                {booking.requester?.fullName?.[0]}
              </div>
              <div>
                <p className="font-medium text-gray-900">{booking.requester?.fullName}</p>
                <p className="text-sm text-gray-500">{booking.requester?.email}</p>
                <p className="text-xs text-gray-400 capitalize">
                  {booking.requester?.roles?.join(', ').toLowerCase().replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Labs detail */}
          {booking.labs?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Lab(s) Requested</h2>
              <div className="space-y-3">
                {booking.labs.map(lab => (
                  <div key={lab.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-primary-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{lab.roomNumber} — {lab.labName}</p>
                      <p className="text-sm text-gray-500">{lab.location} · Capacity: {lab.capacity}</p>
                      <div className="flex gap-2 mt-1">
                        {lab.hasProjector && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Projector</span>}
                        {lab.hasAc && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">AC</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Approval Timeline */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-5">Approval Timeline</h2>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />
              <div className="space-y-6">
                {booking.approvals?.map((approval, i) => (
                  <ApprovalStep key={approval.id} approval={approval} isLast={i === booking.approvals.length - 1} />
                ))}
              </div>
            </div>
          </div>

          {/* Submitted at */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Submitted</p>
            <p>{booking.createdAt ? format(new Date(booking.createdAt), 'dd MMM yyyy, HH:mm') : '—'}</p>
            {booking.updatedAt && (
              <>
                <p className="font-medium text-gray-700 mb-1 mt-3">Last Updated</p>
                <p>{format(new Date(booking.updatedAt), 'dd MMM yyyy, HH:mm')}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, children, className }) {
  return (
    <div className={clsx('space-y-1', className)}>
      <p className="text-xs text-gray-400 flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="text-sm text-gray-800 font-medium">{children}</p>
    </div>
  )
}

function ApprovalStep({ approval, isLast }) {
  const icons = {
    PENDING: <Circle className="w-4 h-4 text-gray-400" />,
    APPROVED: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    REJECTED: <XCircle className="w-4 h-4 text-red-500" />,
    SKIPPED: <SkipForward className="w-4 h-4 text-blue-400" />,
  }

  const statusColors = {
    PENDING: 'text-gray-500 bg-gray-100',
    APPROVED: 'text-green-700 bg-green-100',
    REJECTED: 'text-red-700 bg-red-100',
    SKIPPED: 'text-blue-700 bg-blue-100',
  }

  return (
    <div className="relative flex gap-3 pl-8">
      <div className="absolute left-2 -translate-x-1/2 w-5 h-5 rounded-full bg-white flex items-center justify-center border-2 border-gray-200 z-10">
        {icons[approval.status] || icons.PENDING}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-800">
            {ROLE_LABELS[approval.approverRole] || approval.approverRole}
          </p>
          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', statusColors[approval.status])}>
            {approval.status}
          </span>
        </div>
        {approval.approver && (
          <p className="text-xs text-gray-500 mt-0.5">{approval.approver.fullName}</p>
        )}
        {approval.isAutoApproved && (
          <p className="text-xs text-blue-500 mt-0.5 italic">Auto-approved</p>
        )}
        {approval.comments && (
          <p className="text-xs text-gray-500 mt-1 italic">"{approval.comments}"</p>
        )}
        {approval.actedAt && (
          <p className="text-xs text-gray-400 mt-0.5">
            {format(new Date(approval.actedAt), 'dd MMM, HH:mm')}
          </p>
        )}
      </div>
    </div>
  )
}
