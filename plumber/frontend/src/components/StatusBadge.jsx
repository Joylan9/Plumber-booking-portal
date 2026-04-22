import './StatusBadge.css';

const statusMap = {
  pending: 'status-pending',
  accepted: 'status-accepted',
  completed: 'status-completed',
  cancelled: 'status-cancelled',
};

export default function StatusBadge({ status }) {
  const cls = statusMap[status] || 'status-pending';
  return (
    <span className={`status-badge ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
