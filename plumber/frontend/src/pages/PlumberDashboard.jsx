import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getMyBookings, updateBookingStatus } from '../services/bookingService';
import { formatDate, firstName, clampRating } from '../utils/format';
import DashboardLayout from '../components/DashboardLayout';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { toast } from '../components/Toast';
import './PlumberDashboard.css';

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function ProfileProgress({ user }) {
  const fields = [
    !!user?.name, !!user?.phone, !!user?.area,
    !!user?.experience, !!user?.hourlyRate,
    Array.isArray(user?.services) && user.services.length > 0,
  ];
  const pct = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  return (
    <div className="profile-progress card-panel">
      <div className="progress-header">
        <span className="progress-label">Profile Completeness</span>
        <span className="progress-pct">{pct}%</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PlumberDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, id: null, action: '' });

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const res = await getMyBookings();
      setBookings(res.data || []);
    } catch (err) {
      if (!isBackground) setError(err.message || 'Failed to load bookings');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async () => {
    const { id, action } = modal;
    setModal({ open: false, id: null, action: '' });
    try {
      await updateBookingStatus(id, action);
      setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status: action } : b));
      toast(`Booking ${action} successfully`, 'success');
    } catch (err) {
      toast(err.message || 'Action failed', 'error');
    }
  };

  const pending = bookings.filter(b => b.status === 'pending');
  const active = bookings.filter(b => b.status === 'accepted');
  const completed = bookings.filter(b => b.status === 'completed');
  const thisMonth = bookings.filter(b => {
    const d = new Date(b.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return (
    <DashboardLayout>
      <div className="plumber-dash">
        {/* Welcome */}
        <div className="dash-welcome">
          <h1 className="dash-greeting">{getGreeting()}, {firstName(user?.name)}</h1>
          <p className="dash-date">
            {clampRating(user?.rating) > 0 && <span className="dash-rating">★ {clampRating(user?.rating).toFixed(1)}</span>}
            {(user?.totalReviews || 0) > 0 && <span> · {user.totalReviews} reviews</span>}
          </p>
        </div>

        {loading ? (
          <SkeletonLoader rows={4} type="stats" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <>
            {/* Stats */}
            <motion.div className="dash-stats plumber-stats" variants={stagger} initial="hidden" animate="visible">
              {[
                { label: 'Total Jobs', value: bookings.length, cls: '' },
                { label: 'Pending Requests', value: pending.length, cls: 'stat-amber' },
                { label: 'Completed', value: completed.length, cls: 'stat-green' },
                { label: 'This Month', value: thisMonth.length, cls: '' },
              ].map((s) => (
                <motion.div key={s.label} className="card-panel stat-card" variants={fadeUp}>
                  <span className="stat-label">{s.label}</span>
                  <span className={`stat-value ${s.cls}`}>{s.value}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Profile Progress */}
            <ProfileProgress user={user} />

            {/* Pending Requests */}
            <div className="dash-section">
              <h2 className="dash-section-title">Incoming Requests ({pending.length})</h2>
              {pending.length === 0 ? (
                <EmptyState title="No pending requests" message="New booking requests from customers will appear here." />
              ) : (
                <motion.div className="booking-cards" variants={stagger} initial="hidden" animate="visible">
                  <AnimatePresence>
                    {pending.map((b) => (
                      <motion.div key={b._id} className="card-panel booking-card" variants={fadeUp} layout exit={{ opacity: 0, scale: 0.9 }}>
                        <div className="bc-header">
                          <h4>{b.customerId?.name || '—'}</h4>
                          <StatusBadge status={b.status} />
                        </div>
                        <p className="bc-issue">{b.issueDescription}</p>
                        <div className="bc-meta">
                          <span>{formatDate(b.date)} · {b.time || '—'}</span>
                          <span>{b.address}</span>
                        </div>
                        <div className="bc-actions">
                          <button className="btn-primary bc-btn" onClick={() => setModal({ open: true, id: b._id, action: 'accepted' })}>Accept</button>
                          <button className="btn-outline bc-btn bc-btn-decline" onClick={() => setModal({ open: true, id: b._id, action: 'cancelled' })}>Decline</button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>

            {/* Active Bookings */}
            {active.length > 0 && (
              <div className="dash-section">
                <h2 className="dash-section-title">Active Bookings ({active.length})</h2>
                <motion.div className="booking-cards" variants={stagger} initial="hidden" animate="visible">
                  <AnimatePresence>
                    {active.map((b) => (
                      <motion.div key={b._id} className="card-panel booking-card" variants={fadeUp} layout exit={{ opacity: 0, scale: 0.9 }}>
                        <div className="bc-header">
                          <h4>{b.customerId?.name || '—'}</h4>
                          <StatusBadge status={b.status} />
                        </div>
                        <p className="bc-issue">{b.issueDescription}</p>
                        <div className="bc-meta">
                          <span>{formatDate(b.date)} · {b.time || '—'}</span>
                          <span>{b.address}</span>
                        </div>
                        <div className="bc-actions">
                          <button className="btn-primary bc-btn" onClick={() => setModal({ open: true, id: b._id, action: 'completed' })}>Mark Complete</button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}
          </>
        )}

        <ConfirmModal
          isOpen={modal.open}
          title={modal.action === 'cancelled' ? 'Decline Booking?' : modal.action === 'completed' ? 'Complete Booking?' : 'Accept Booking?'}
          message={modal.action === 'cancelled' ? 'This will notify the customer that you are unavailable.' : modal.action === 'completed' ? 'Confirm this job has been completed.' : 'You will be assigned to this booking.'}
          confirmLabel={modal.action === 'cancelled' ? 'Decline' : 'Confirm'}
          danger={modal.action === 'cancelled'}
          onConfirm={handleAction}
          onCancel={() => setModal({ open: false, id: null, action: '' })}
        />
      </div>
    </DashboardLayout>
  );
}
