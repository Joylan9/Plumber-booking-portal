import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getBookingById, updateBookingStatus } from '../services/bookingService';
import StatusBadge from '../components/StatusBadge';
import ReviewForm from '../components/ReviewForm';
import ConfirmModal from '../components/ConfirmModal';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorState from '../components/ErrorState';
import { toast } from '../components/Toast';
import './BookingDetail.css';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const timelineSteps = ['pending', 'accepted', 'completed'];

function StatusTimeline({ current }) {
  const idx = timelineSteps.indexOf(current);
  const cancelled = current === 'cancelled';
  return (
    <div className="bd-timeline">
      {timelineSteps.map((step, i) => (
        <div key={step} className={`bd-timeline-step ${i <= idx && !cancelled ? 'done' : ''} ${cancelled && step === 'pending' ? 'done' : ''}`}>
          <div className="bd-timeline-dot">
            {i <= idx && !cancelled ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : null}
          </div>
          <span className="bd-timeline-label">{step.charAt(0).toUpperCase() + step.slice(1)}</span>
          {i < timelineSteps.length - 1 && <div className={`bd-timeline-line ${i < idx && !cancelled ? 'active' : ''}`} />}
        </div>
      ))}
      {cancelled && (
        <div className="bd-timeline-step cancelled-step">
          <div className="bd-timeline-dot cancelled-dot">✕</div>
          <span className="bd-timeline-label">Cancelled</span>
        </div>
      )}
    </div>
  );
}

export default function BookingDetail() {
  const { id } = useParams();
  const { user, isPlumber } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, action: '' });
  const [reviewDone, setReviewDone] = useState(false);

  const fetchBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBookingById(id);
      setBooking(res.data || res);
    } catch (err) {
      setError(err.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooking(); }, [id]);

  const handleAction = async () => {
    const { action } = modal;
    setModal({ open: false, action: '' });
    try {
      await updateBookingStatus(id, action);
      setBooking((prev) => ({ ...prev, status: action }));
      toast(`Booking ${action}`, 'success');
    } catch (err) {
      toast(err.message || 'Action failed', 'error');
    }
  };

  if (loading) return <div className="bd-container"><SkeletonLoader rows={4} /></div>;
  if (error) return <div className="bd-container"><ErrorState message={error} onRetry={fetchBooking} /></div>;
  if (!booking) return null;

  const otherUser = isPlumber ? booking.customerId : booking.plumberId;
  const showReview = !isPlumber && booking.status === 'completed' && !reviewDone;

  return (
    <div className="bd-container">
      <Link to="/dashboard" className="bd-back">← Back to Dashboard</Link>

      <motion.div className="card-panel bd-card" initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5 }}>
        <div className="bd-header">
          <h1 className="bd-title">Booking Details</h1>
          <StatusBadge status={booking.status} />
        </div>

        <StatusTimeline current={booking.status} />

        <div className="bd-grid">
          <div className="bd-field">
            <span className="bd-label">{isPlumber ? 'Customer' : 'Plumber'}</span>
            <span className="bd-value">{otherUser?.name || 'N/A'}</span>
          </div>
          <div className="bd-field">
            <span className="bd-label">Date & Time</span>
            <span className="bd-value">{new Date(booking.date).toLocaleDateString()} at {booking.time}</span>
          </div>
          <div className="bd-field full">
            <span className="bd-label">Address</span>
            <span className="bd-value">{booking.address}</span>
          </div>
          <div className="bd-field full">
            <span className="bd-label">Issue</span>
            <span className="bd-value">{booking.issueDescription}</span>
          </div>
          {booking.notes && (
            <div className="bd-field full">
              <span className="bd-label">Notes</span>
              <span className="bd-value">{booking.notes}</span>
            </div>
          )}
          <div className="bd-field">
            <span className="bd-label">Reference ID</span>
            <span className="bd-value bd-ref">{booking._id}</span>
          </div>
        </div>

        {/* Plumber actions */}
        {isPlumber && booking.status === 'pending' && (
          <div className="bd-actions">
            <button className="btn-primary bd-action-btn" onClick={() => setModal({ open: true, action: 'accepted' })}>Accept</button>
            <button className="btn-outline bd-action-btn bd-decline" onClick={() => setModal({ open: true, action: 'cancelled' })}>Decline</button>
          </div>
        )}
        {isPlumber && booking.status === 'accepted' && (
          <div className="bd-actions">
            <button className="btn-primary bd-action-btn" onClick={() => setModal({ open: true, action: 'completed' })}>Mark Complete</button>
          </div>
        )}
      </motion.div>

      {/* Review form for customer */}
      {showReview && (
        <ReviewForm bookingId={booking._id} plumberId={booking.plumberId?._id || booking.plumberId} onReviewSubmitted={() => setReviewDone(true)} />
      )}

      <ConfirmModal
        isOpen={modal.open}
        title={modal.action === 'cancelled' ? 'Decline Booking?' : modal.action === 'completed' ? 'Complete Booking?' : 'Accept Booking?'}
        message={modal.action === 'cancelled' ? 'This will notify the customer.' : modal.action === 'completed' ? 'Confirm this job is done.' : 'You will be assigned.'}
        confirmLabel={modal.action === 'cancelled' ? 'Decline' : 'Confirm'}
        danger={modal.action === 'cancelled'}
        onConfirm={handleAction}
        onCancel={() => setModal({ open: false, action: '' })}
      />
    </div>
  );
}
