import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPlumberById } from '../services/plumberService';
import { getPlumberReviews } from '../services/reviewService';
import { formatCurrency, clampRating, nameInitial, firstName } from '../utils/format';
import ReviewCard from '../components/ReviewCard';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import './PlumberProfile.css';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

function StarDisplay({ rating, count }) {
  const clamped = clampRating(rating);
  return (
    <span className="pp-star-display">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill={i <= Math.round(clamped) ? 'var(--amber-cta)' : 'none'} stroke={i <= Math.round(clamped) ? 'var(--amber-cta)' : '#ccc'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="pp-rating-text">{clamped > 0 ? clamped.toFixed(1) : '0.0'} ({count || 0} reviews)</span>
    </span>
  );
}

export default function PlumberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plumber, setPlumber] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  const fetchPlumber = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPlumberById(id);
      if (!res?.data) {
        setError('Plumber profile not found');
        return;
      }
      setPlumber(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load plumber profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (page = 1) => {
    try {
      const res = await getPlumberReviews(id, page);
      const list = Array.isArray(res?.data) ? res.data : [];
      if (page === 1) setReviews(list);
      else setReviews((prev) => [...prev, ...list]);
      setHasMoreReviews(list.length >= 10);
      setReviewPage(page);
    } catch (err) {
      setReviewError(err.message || 'Failed to load reviews');
    }
  };

  useEffect(() => {
    if (!id) { navigate('/plumbers', { replace: true }); return; }
    fetchPlumber();
    fetchReviews(1);
  }, [id]);

  if (loading) return <div className="pp-container"><SkeletonLoader rows={3} type="card" /></div>;
  if (error) return <div className="pp-container"><ErrorState message={error} onRetry={fetchPlumber} /></div>;
  if (!plumber) return (
    <div className="pp-container">
      <EmptyState title="Profile not found" message="This plumber profile could not be loaded." actionLabel="Browse Plumbers" onAction={() => navigate('/plumbers')} />
    </div>
  );

  return (
    <div className="pp-container">
      <motion.div className="card-panel pp-hero" initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5 }}>
        <div className="pp-avatar">{nameInitial(plumber.name)}</div>
        <div className="pp-info">
          <h1 className="pp-name">{plumber.name || 'Plumber'}</h1>
          <p className="pp-area">{plumber.area || 'Remote Service'}</p>
          <StarDisplay rating={plumber.rating} count={plumber.totalReviews} />
        </div>
      </motion.div>

      <div className="pp-grid">
        <div className="pp-details">
          <div className="card-panel pp-detail-card">
            <h3>About</h3>
            <p>{plumber.bio || 'No bio provided.'}</p>
          </div>

          <div className="card-panel pp-detail-card">
            <h3>Services</h3>
            <div className="pp-tags">
              {(Array.isArray(plumber.services) && plumber.services.length > 0)
                ? plumber.services.map((s, i) => <span key={i} className="service-tag">{s}</span>)
                : <span className="service-tag">General Plumbing</span>
              }
            </div>
          </div>

          <div className="card-panel pp-detail-card pp-stats-inline">
            <div><span className="pp-stat-label">Experience</span><span className="pp-stat-val">{plumber.experience || 0} years</span></div>
            <div><span className="pp-stat-label">Hourly Rate</span><span className="pp-stat-val">{formatCurrency(plumber.hourlyRate)}/hr</span></div>
          </div>

          <button className="btn-primary pp-book-btn" onClick={() => navigate(`/booking?plumber=${plumber._id}`)}>
            Book {firstName(plumber.name)}
          </button>
        </div>

        <div className="pp-reviews-section">
          <h3 className="pp-reviews-title">Reviews ({plumber.totalReviews || reviews.length})</h3>
          {reviewError ? (
            <p className="pp-no-reviews" style={{ color: 'var(--red)' }}>{reviewError}</p>
          ) : reviews.length === 0 ? (
            <p className="pp-no-reviews">No reviews yet.</p>
          ) : (
            <div className="pp-reviews-list">
              {reviews.map((r) => (
                <ReviewCard key={r._id || r.id} review={r} />
              ))}
              {hasMoreReviews && (
                <button className="btn-outline pp-load-more" onClick={() => fetchReviews(reviewPage + 1)}>
                  Load More
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
