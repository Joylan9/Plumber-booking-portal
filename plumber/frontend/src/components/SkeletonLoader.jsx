import './SkeletonLoader.css';

export default function SkeletonLoader({ rows = 3, type = 'list' }) {
  if (type === 'stats') {
    return (
      <div className="skeleton-stats-row">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="skeleton-stat-card">
            <div className="skeleton-line skeleton-short" />
            <div className="skeleton-line skeleton-number" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="skeleton-card-grid">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="skeleton-card-item">
            <div className="skeleton-avatar" />
            <div className="skeleton-line skeleton-wide" />
            <div className="skeleton-line skeleton-medium" />
            <div className="skeleton-line skeleton-short" />
          </div>
        ))}
      </div>
    );
  }

  // Default: list/table rows
  return (
    <div className="skeleton-list">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton-line skeleton-wide" />
          <div className="skeleton-line skeleton-medium" />
        </div>
      ))}
    </div>
  );
}
