import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getMyBookings, updateBookingStatus } from '../services/bookingService';
import { formatDate, firstName, clampRating, formatCurrency } from '../utils/format';
import PlumberLayout from '../components/PlumberLayout';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { toast } from '../components/Toast';
import BookingMap from '../components/BookingMap';
import './PlumberDashboard.css';

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } } };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10);
    if (start === end) return setCount(end);
    
    let totalDuration = 1000;
    let incrementTime = (totalDuration / end);
    
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}</span>;
}

export default function PlumberDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering & Modal States
  const [activeTab, setActiveTab] = useState('All');
  const [selectedJob, setSelectedJob] = useState(null); // Controls Job Detail Drawer
  const [modal, setModal] = useState({ open: false, id: null, action: '' });

  const fetchData = useCallback(async (isBackground = false) => {
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
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (selectedJob) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedJob]);

  const handleAction = useCallback(async () => {
    const { id, action } = modal;
    setModal({ open: false, id: null, action: '' });
    try {
      await updateBookingStatus(id, action);
      setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status: action } : b));
      if (selectedJob && selectedJob._id === id) {
        setSelectedJob(prev => ({ ...prev, status: action }));
      }
      toast(`Booking ${action} successfully`, 'success');
    } catch (err) {
      toast(err.message || 'Action failed', 'error');
    }
  }, [modal, selectedJob]);

  // Derived Stats
  const pending = useMemo(() => bookings.filter(b => b.status === 'pending'), [bookings]);
  const active = useMemo(() => bookings.filter(b => b.status === 'accepted'), [bookings]);
  const completed = useMemo(() => bookings.filter(b => b.status === 'completed'), [bookings]);
  
  const todayJobs = useMemo(() => bookings.filter(b => {
    const d = new Date(b.date);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }), [bookings]);

  // Filtered List
  const filteredBookings = useMemo(() => bookings.filter(b => {
    if (activeTab === 'All') return true;
    if (activeTab === 'In Progress') return b.status === 'accepted';
    if (activeTab === 'Confirmed') return b.status === 'accepted';
    return b.status.toLowerCase() === activeTab.toLowerCase();
  }), [bookings, activeTab]);

  const tabs = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'];

  const getActionButtons = (b, isDrawer = false) => {
    if (b.status === 'pending') {
      return (
        <div className={`pl-action-group ${isDrawer ? 'drawer-actions' : ''}`}>
          <button className="pl-btn pl-btn-success" onClick={(e) => { e.stopPropagation(); setModal({ open: true, id: b._id, action: 'accepted' }); }}>Accept Job</button>
          <button className="pl-btn pl-btn-danger" onClick={(e) => { e.stopPropagation(); setModal({ open: true, id: b._id, action: 'cancelled' }); }}>Decline</button>
        </div>
      );
    }
    if (b.status === 'accepted') {
      return (
        <div className={`pl-action-group ${isDrawer ? 'drawer-actions' : ''}`}>
          <button className="pl-btn pl-btn-primary" onClick={(e) => { e.stopPropagation(); setModal({ open: true, id: b._id, action: 'completed' }); }}>Mark as Completed</button>
        </div>
      );
    }
    return null;
  };

  return (
    <PlumberLayout title="Jobs & Bookings">
      <div className="pl-dashboard-home">
        
        {/* Greeting Header */}
        <div className="pl-greeting-box">
          <h2>{getGreeting()}, <span className="pl-greeting-name">{firstName(user?.name)}</span> 👋</h2>
          <p className="pl-weather-text">You have {todayJobs.length} jobs scheduled for today.</p>
        </div>

        {loading ? (
          <SkeletonLoader rows={4} type="stats" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <>
            {/* STATS ROW */}
            <motion.div className="pl-stats-grid" variants={stagger} initial="hidden" animate="visible">
              {[
                { label: "Today's Jobs", value: todayJobs.length, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'blue' },
                { label: "Pending Approvals", value: pending.length, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'amber' },
                { label: "Active/In-Progress", value: active.length, icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'blue' },
                { label: "Total Completed", value: completed.length, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'green' },
              ].map((stat, i) => (
                <motion.div key={i} className={`pl-stat-card border-${stat.color}`} variants={fadeUp}>
                  <div className="pl-stat-header">
                    <span className="pl-stat-label">{stat.label}</span>
                    <div className={`pl-stat-icon text-${stat.color}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={stat.icon}/></svg>
                    </div>
                  </div>
                  <div className="pl-stat-value">
                    <AnimatedCounter value={stat.value} />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* JOBS MODULE */}
            <div className="pl-jobs-module">
              {/* Tabs */}
              <div className="pl-tabs">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    className={`pl-tab ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                    {activeTab === tab && <motion.div layoutId="activeTabIndicator" className="pl-tab-indicator" />}
                  </button>
                ))}
              </div>

              {/* Job List */}
              {filteredBookings.length === 0 ? (
                <EmptyState title="No jobs found" message={`You have no ${activeTab.toLowerCase()} bookings at the moment.`} />
              ) : (
                <motion.div className="pl-job-list" variants={stagger} initial="hidden" animate="visible">
                  <AnimatePresence>
                    {filteredBookings.map((b) => (
                      <motion.div 
                        key={b._id} 
                        className="pl-job-card" 
                        variants={fadeUp} 
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => setSelectedJob(b)}
                      >
                        <div className="pl-jc-top">
                          <StatusBadge status={b.status} />
                          <span className="pl-jc-date">{formatDate(b.date)} • {b.time}</span>
                        </div>
                        <div className="pl-jc-main">
                          <h3 className="pl-jc-customer">{b.customerId?.name || 'Customer'}</h3>
                          <p className="pl-jc-address">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            {b.address}
                          </p>
                        </div>
                        <div className="pl-jc-meta">
                          <span className="pl-jc-service">{b.serviceType}</span>
                        </div>
                        <p className="pl-jc-desc">{b.issueDescription}</p>
                        
                        {/* Footer / Actions */}
                        <div className="pl-jc-footer">
                          <button className="pl-btn-text" onClick={(e) => { e.stopPropagation(); setSelectedJob(b); }}>View Details →</button>
                          {getActionButtons(b)}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </>
        )}

        {/* JOB DETAIL DRAWER */}
        <AnimatePresence>
          {selectedJob && (
            <>
              <motion.div 
                className="pl-drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedJob(null)}
              />
              <motion.div 
                className="pl-drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                <div className="pl-drawer-header">
                  <h3>Job Details</h3>
                  <button className="pl-drawer-close" onClick={() => setSelectedJob(null)}>×</button>
                </div>
                
                <div className="pl-drawer-body" style={{ overflowY: 'auto', flex: '1 1 0%', height: 0 }}>
                  <div className="pl-drawer-status-bar">
                    <StatusBadge status={selectedJob.status} />
                    <span className="pl-job-id">ID: {selectedJob._id.substring(18)}</span>
                  </div>

                  <div className="pl-detail-section">
                    <h4>Customer Information</h4>
                    <div className="pl-info-row">
                      <span>Name</span>
                      <strong>{selectedJob.customerId?.name || 'N/A'}</strong>
                    </div>
                    <div className="pl-info-row">
                      <span>Phone</span>
                      <strong>{selectedJob.customerId?.phone || 'N/A'}</strong>
                    </div>
                    <div className="pl-info-row">
                      <span>Email</span>
                      <strong>{selectedJob.customerId?.email || 'N/A'}</strong>
                    </div>
                    <div className="pl-info-row">
                      <span>Address</span>
                      <strong>{selectedJob.address}</strong>
                    </div>
                  </div>

                  <div className="pl-detail-section" style={{ marginTop: '20px', marginBottom: '20px' }}>
                    <h4>Location Map</h4>
                    <div style={{ marginTop: '10px' }}>
                      <BookingMap 
                        customerAddress={selectedJob.address} 
                        plumberAddress={user?.area || 'Plumber Location'} 
                      />
                    </div>
                  </div>

                  <div className="pl-detail-section">
                    <h4>Service Requirements</h4>
                    <div className="pl-info-row">
                      <span>Service Type</span>
                      <strong>{selectedJob.serviceType}</strong>
                    </div>
                    <div className="pl-info-row">
                      <span>Scheduled For</span>
                      <strong>{formatDate(selectedJob.date)} at {selectedJob.time}</strong>
                    </div>
                  </div>

                  <div className="pl-detail-section">
                    <h4>Issue Description</h4>
                    <p className="pl-desc-box">{selectedJob.issueDescription}</p>
                  </div>

                  {selectedJob.notes && (
                    <div className="pl-detail-section">
                      <h4>Additional Notes</h4>
                      <p className="pl-desc-box">{selectedJob.notes}</p>
                    </div>
                  )}
                </div>

                <div className="pl-drawer-footer">
                  {getActionButtons(selectedJob, true)}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
    </PlumberLayout>
  );
}
