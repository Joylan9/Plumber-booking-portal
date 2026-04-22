import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getBookingById, updateBookingStatus } from '../services/bookingService';
import { formatDate, normalizeStatus } from '../utils/format';
import StatusBadge from '../components/StatusBadge';
import ReviewForm from '../components/ReviewForm';
import ConfirmModal from '../components/ConfirmModal';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { toast } from '../components/Toast';
import './BookingDetail.css';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const timelineSteps = ['pending', 'accepted', 'completed'];

function StatusTimeline({ current }) {
  const safe = normalizeStatus(current);
  const idx = timelineSteps.indexOf(safe);
  const cancelled = safe === 'cancelled';
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
  const navigate = useNavigate();
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
      const data = res?.data || res;
      if (!data || !data._id) {
        setError('Booking not found');
        return;
      }
      setBooking(data);
    } catch (err) {
      setError(err.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) { navigate('/dashboard', { replace: true }); return; }
    fetchBooking();
  }, [id]);

  const handleAction = async () => {
    const { action } = modal;
    setModal({ open: false, action: '' });
    try {
      await updateBookingStatus(id, action);
      setBooking((prev) => prev ? { ...prev, status: action } : prev);
      toast(`Booking ${action}`, 'success');
    } catch (err) {
      toast(err.message || 'Action failed', 'error');
    }
  };

  if (loading) return <div className="bd-container"><SkeletonLoader rows={4} /></div>;
  if (error) return <div className="bd-container"><ErrorState message={error} onRetry={fetchBooking} /></div>;
  if (!booking) return (
    <div className="bd-container">
      <EmptyState title="Booking not found" message="This booking could not be loaded." actionLabel="Go to Dashboard" onAction={() => navigate('/dashboard')} />
    </div>
  );

  const status = normalizeStatus(booking.status);
  const otherUser = isPlumber ? booking.customerId : booking.plumberId;
  const showReview = !isPlumber && status === 'completed' && !reviewDone;

  return (
    <div className="bd-container">
      <Link to="/dashboard" className="bd-back">← Back to Dashboard</Link>

      <motion.div className="card-panel bd-card" initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5 }}>
        <div className="bd-header">
          <h1 className="bd-title">Booking Details</h1>
          <StatusBadge status={status} />
        </div>

        <StatusTimeline current={status} />

        <div className="bd-grid">
          <div className="bd-field">
            <span className="bd-label">{isPlumber ? 'Customer' : 'Plumber'}</span>
            <span className="bd-value">{otherUser?.name || '—'}</span>
          </div>
          <div className="bd-field">
            <span className="bd-label">Date & Time</span>
            <span className="bd-value">{formatDate(booking.date)} at {booking.time || '—'}</span>
          </div>
          <div className="bd-field full">
            <span className="bd-label">Address</span>
            <span className="bd-value">{booking.address || '—'}</span>
          </div>
          <div className="bd-field full">
            <span className="bd-label">Issue</span>
            <span className="bd-value">{booking.issueDescription || '—'}</span>
          </div>
          {booking.notes && (
            <div className="bd-field full">
              <span className="bd-label">Notes</span>
              <span className="bd-value">{booking.notes}</span>
            </div>
          )}
          <div className="bd-field">
            <span className="bd-label">Reference ID</span>
            <span className="bd-value bd-ref">{booking._id || '—'}</span>
          </div>
        </div>

        {/* Plumber actions — only visible to plumber role */}
        {isPlumber && status === 'pending' && (
          <div className="bd-actions">
            <button className="btn-primary bd-action-btn" onClick={() => setModal({ open: true, action: 'accepted' })}>Accept</button>
            <button className="btn-outline bd-action-btn bd-decline" onClick={() => setModal({ open: true, action: 'cancelled' })}>Decline</button>
          </div>
        )}
        {isPlumber && status === 'accepted' && (
          <div className="bd-actions">
            <button className="btn-primary bd-action-btn" onClick={() => setModal({ open: true, action: 'completed' })}>Mark Complete</button>
          </div>
        )}
      </motion.div>

      {/* Review form — only visible to customer after completion */}
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
