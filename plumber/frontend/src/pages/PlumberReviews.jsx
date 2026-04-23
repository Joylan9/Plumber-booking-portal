import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getPlumberReviews } from '../services/reviewService';
import { formatDate } from '../utils/format';
import PlumberLayout from '../components/PlumberLayout';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import './PlumberReviews.css';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } };

// Star component
const Stars = ({ rating }) => {
  return (
    <div className="pl-stars">
      {[1, 2, 3, 4, 5].map(star => (
        <svg key={star} className={`pl-star ${star <= rating ? 'filled' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
};

export default function PlumberReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) {
      getPlumberReviews(user._id)
        .then(res => setReviews(res.data || []))
        .catch(err => console.error("Failed to load reviews", err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  // Calculations
  const stats = useMemo(() => {
    if (!reviews.length) return { average: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / reviews.length;
    
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (dist[r.rating] !== undefined) dist[r.rating]++;
    });

    return { average: avg.toFixed(1), distribution: dist };
  }, [reviews]);

  return (
    <PlumberLayout title="My Reviews">
      <div className="pl-reviews-container">
        
        {loading ? (
          <SkeletonLoader rows={5} type="stats" />
        ) : (
          <>
            {/* Reviews Header & Stats */}
            <motion.div className="pl-reviews-header pl-card" variants={fadeUp} initial="hidden" animate="visible">
              <div className="pl-reviews-summary">
                <h2>{stats.average}</h2>
                <Stars rating={Math.round(stats.average)} />
                <p>Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
              </div>
              
              <div className="pl-reviews-distribution">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = stats.distribution[star];
                  const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="pl-dist-row">
                      <span className="pl-dist-label">{star} Star</span>
                      <div className="pl-dist-bar-bg">
                        <motion.div 
                          className="pl-dist-bar-fill" 
                          initial={{ width: 0 }} 
                          animate={{ width: `${percentage}%` }} 
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <span className="pl-dist-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <EmptyState title="No reviews yet" message="When customers leave you a review, it will appear here." />
            ) : (
              <div className="pl-reviews-list">
                <AnimatePresence>
                  {reviews.map((r, i) => (
                    <motion.div 
                      key={r._id} 
                      className="pl-review-card pl-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="pl-rc-header">
                        <div className="pl-rc-customer">
                          <div className="pl-rc-avatar">{r.customerId?.name?.charAt(0) || 'C'}</div>
                          <div>
                            <h4>{r.customerId?.name || 'Anonymous Customer'}</h4>
                            <span className="pl-rc-date">{formatDate(r.createdAt)}</span>
                          </div>
                        </div>
                        <Stars rating={r.rating} />
                      </div>
                      <p className="pl-rc-comment">"{r.comment}"</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </PlumberLayout>
  );
}
