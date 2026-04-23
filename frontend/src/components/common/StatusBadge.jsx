export default function StatusBadge({ status }) {
  const map = {
    PENDING:   'badge-pending',
    IN_REVIEW: 'badge-in-review',
    APPROVED:  'badge-approved',
    REJECTED:  'badge-rejected',
    CANCELLED: 'badge-cancelled',
    SKIPPED:   'badge-cancelled',
  }
  return (
    <span className={map[status] ?? 'badge-pending'}>
      {status?.replace('_', ' ')}
    </span>
  )
}
