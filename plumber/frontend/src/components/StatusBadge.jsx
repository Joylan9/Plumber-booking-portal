import { normalizeStatus } from '../utils/format';
import './StatusBadge.css';

const statusMap = {
  pending: 'status-pending',
  accepted: 'status-accepted',
  completed: 'status-completed',
  cancelled: 'status-cancelled',
};

export default function StatusBadge({ status }) {
  const safe = normalizeStatus(status);
  const cls = statusMap[safe] || 'status-pending';
  return (
    <span className={`status-badge ${cls}`}>
      {safe.charAt(0).toUpperCase() + safe.slice(1)}
    </span>
  );
}
