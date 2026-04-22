import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPlumbers } from '../services/plumberService';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import './PlumberList.css';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const PlumberList = () => {
  const navigate = useNavigate();
  const [plumbers, setPlumbers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceFilter, setServiceFilter] = useState('');
  const [sortBy, setSortBy] = useState('');

  const fetchPlumbers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlumbers();
      if (data.success) {
        setPlumbers(data.data);
        setFiltered(data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch plumbers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlumbers(); }, []);

  // Filter and sort
  useEffect(() => {
    let result = [...plumbers];
    if (serviceFilter) {
      result = result.filter(p => (p.services || []).some(s => s.toLowerCase().includes(serviceFilter.toLowerCase())));
    }
    if (sortBy === 'high') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    setFiltered(result);
  }, [serviceFilter, sortBy, plumbers]);

  // Collect unique services for filter dropdown
  const allServices = [...new Set(plumbers.flatMap(p => p.services || []))];

  return (
    <div className="plumbers-page">
      {/* Sticky Filter Bar */}
      <div className="filter-bar glass-panel">
        <div className="filter-container">
          <h2>Available Professionals</h2>
          <div className="filter-options">
            <select className="premium-input" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
              <option value="">All Services</option>
              {allServices.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select className="premium-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
               <option value="">Sort by...</option>
               <option value="high">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="plumbers-container">
        {loading ? (
          <SkeletonLoader rows={6} type="card" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchPlumbers} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No plumbers found" message="Try adjusting your filters." />
        ) : (
          <motion.div 
            className="plumbers-grid"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filtered.map(plumber => (
              <motion.div 
                 key={plumber._id} 
                 className="card-panel plumber-card"
                 variants={fadeUpVariant}
                 whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(10, 37, 64, 0.12)" }}
                 onClick={() => navigate(`/plumbers/${plumber._id}`)}
                 style={{ cursor: 'pointer' }}
              >
                <div className="plumber-header">
                  <div className="avatar">{plumber.name.charAt(0)}</div>
                  <div className="plumber-info">
                    <h3>{plumber.name}</h3>
                    <p className="area">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: '-2px', marginRight: '4px' }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {plumber.area || 'Remote Service'}
                    </p>
                  </div>
                </div>
                
                <div className="plumber-stats">
                  <div className="stat">
                    <span className="stars">
                      {[1,2,3,4,5].map(i => (
                        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= Math.round(plumber.rating || 0) ? 'var(--amber-cta)' : 'none'} stroke={i <= Math.round(plumber.rating || 0) ? 'var(--amber-cta)' : '#ccc'} strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </span>
                    <span className="rating-text">({plumber.totalReviews || 0})</span>
                  </div>
                  <div className="stat">
                    <span className="badge experience-badge">{plumber.experience || 0} Yrs Exp</span>
                  </div>
                </div>

                <div className="plumber-services">
                  {(plumber.services || ['General Plumbing']).map((service, idx) => (
                    <span key={idx} className="service-tag">{service}</span>
                  ))}
                </div>

                <div className="plumber-footer">
                   <div className="rate">${plumber.hourlyRate || 80}<span>/hr</span></div>
                   <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <button className="btn-primary book-sm-btn" onClick={(e) => { e.stopPropagation(); navigate(`/booking?plumber=${plumber._id}`); }}>Book Now</button>
                   </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PlumberList;
