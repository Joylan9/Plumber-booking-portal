import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/bookingService';
import { formatDate, firstName } from '../utils/format';
import DashboardLayout from '../components/DashboardLayout';
import StatusBadge from '../components/StatusBadge';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import './CustomerDashboard.css';

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    let start = 0;
    const step = Math.max(1, Math.floor(value / 20));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{count}</span>;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  const recent = bookings.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="customer-dash">
        {/* Welcome */}
        <div className="dash-welcome">
          <h1 className="dash-greeting">{getGreeting()}, {firstName(user?.name)}</h1>
          <p className="dash-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {loading ? (
          <SkeletonLoader rows={3} type="stats" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <>
            {/* Stats */}
            <motion.div className="dash-stats" variants={stagger} initial="hidden" animate="visible">
              <motion.div className="card-panel stat-card" variants={fadeUp}>
                <span className="stat-label">Total Bookings</span>
                <span className="stat-value"><AnimatedCounter value={stats.total} /></span>
              </motion.div>
              <motion.div className="card-panel stat-card" variants={fadeUp}>
                <span className="stat-label">Pending</span>
                <span className="stat-value stat-amber"><AnimatedCounter value={stats.pending} /></span>
              </motion.div>
              <motion.div className="card-panel stat-card" variants={fadeUp}>
                <span className="stat-label">Completed</span>
                <span className="stat-value stat-green"><AnimatedCounter value={stats.completed} /></span>
              </motion.div>
            </motion.div>

            {bookings.length === 0 ? (
              <EmptyState
                title="No bookings yet"
                message="Find a plumber to get started with your first booking."
                actionLabel="Find a Plumber"
                onAction={() => navigate('/plumbers')}
              />
            ) : (
              <>
                {/* Recent Bookings Table */}
                <div className="dash-section">
                  <h2 className="dash-section-title">Recent Bookings</h2>
                  <div className="bookings-table-wrap card-panel">
                    <table className="bookings-table">
                      <thead>
                        <tr>
                          <th>Plumber</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <motion.tbody variants={stagger} initial="hidden" animate="visible">
                        {recent.map((b) => (
                          <motion.tr key={b._id} variants={fadeUp}>
                            <td className="td-name">{b.plumberId?.name || '—'}</td>
                            <td>{formatDate(b.date)}</td>
                            <td><StatusBadge status={b.status} /></td>
                            <td>
                              <Link to={`/bookings/${b._id}`} className="btn-outline table-action-btn">View</Link>
                            </td>
                          </motion.tr>
                        ))}
                      </motion.tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Quick Action */}
            <div className="dash-quick-action card-panel">
              <div>
                <h3>Need a plumber?</h3>
                <p>Browse verified professionals and book instantly.</p>
              </div>
              <Link to="/plumbers" className="btn-primary">Book a Plumber</Link>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
