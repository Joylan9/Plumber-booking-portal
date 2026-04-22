import { useState } from 'react';
import { createReview } from '../services/reviewService';
import { toast } from '../components/Toast';
import './ReviewForm.css';

function InteractiveStars({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="rf-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill={(hover || value) >= i ? 'var(--amber-cta)' : 'none'}
          stroke={(hover || value) >= i ? 'var(--amber-cta)' : '#ccc'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewForm({ bookingId, plumberId, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a rating'); return; }
    if (comment.length > 0 && comment.length < 10) { setError('Comment must be at least 10 characters'); return; }
    setError(null);
    setSubmitting(true);
    try {
      await createReview({ bookingId, plumberId, rating, comment });
      setSubmitted(true);
      toast('Review submitted successfully', 'success');
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="card-panel review-form-done">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--confirm-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        <p>Thank you for your review!</p>
      </div>
    );
  }

  return (
    <form className="card-panel review-form" onSubmit={handleSubmit}>
      <h4 className="rf-title">Leave a Review</h4>
      <InteractiveStars value={rating} onChange={setRating} />
      <textarea
        className="premium-input rf-textarea"
        placeholder="Share your experience (optional, min 10 chars)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows="3"
        maxLength={500}
      />
      {error && <p className="rf-error">{error}</p>}
      <button className="btn-primary rf-submit" type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
