import './ReviewCard.css';

function StarRating({ rating }) {
  return (
    <span className="rc-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i <= rating ? 'var(--amber-cta)' : 'none'} stroke={i <= rating ? 'var(--amber-cta)' : '#ccc'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ReviewCard({ review }) {
  const name = review.customerId?.name || 'Anonymous';
  const displayName = name.split(' ')[0] + (name.split(' ')[1] ? ` ${name.split(' ')[1].charAt(0)}.` : '');

  return (
    <div className="card-panel review-card">
      <div className="rc-header">
        <StarRating rating={review.rating} />
        <span className="rc-date">{timeAgo(review.createdAt)}</span>
      </div>
      {review.comment && <p className="rc-comment">{review.comment}</p>}
      <p className="rc-author">{displayName}</p>
    </div>
  );
}
