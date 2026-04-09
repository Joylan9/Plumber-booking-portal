import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
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
  const [plumbers, setPlumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlumbers = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/plumbers');
        if (data.success) {
          setPlumbers(data.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch plumbers');
      } finally {
        setLoading(false);
      }
    };
    fetchPlumbers();
  }, []);

  return (
    <div className="plumbers-page">
      {/* Sticky Filter Bar */}
      <div className="filter-bar glass-panel">
        <div className="filter-container">
          <h2>Available Professionals</h2>
          <div className="filter-options">
            <select className="premium-input">
              <option value="">Filter by Service...</option>
              <option value="Leak Repair">Leak Repair</option>
              <option value="Pipe Installation">Pipe Installation</option>
              <option value="Drain Cleaning">Drain Cleaning</option>
            </select>
            <select className="premium-input">
               <option value="">Sort by Rating</option>
               <option value="high">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="plumbers-container">
        {loading ? (
          <div className="loading-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-card"></div>
            ))}
          </div>
        ) : error ? (
          <div className="auth-error">{error}</div>
        ) : (
          <motion.div 
            className="plumbers-grid"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {plumbers.map(plumber => (
              <motion.div 
                 key={plumber._id} 
                 className="card-panel plumber-card"
                 variants={fadeUpVariant}
                 whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(10, 37, 64, 0.12)" }}
              >
                <div className="plumber-header">
                  <div className="avatar">{plumber.name.charAt(0)}</div>
                  <div className="plumber-info">
                    <h3>{plumber.name}</h3>
                    <p className="area">📍 {plumber.area || 'Remote Service'}</p>
                  </div>
                </div>
                
                <div className="plumber-stats">
                  <div className="stat">
                    <span className="stars">{'★'.repeat(Math.round(plumber.rating || 5))}</span>
                    <span className="rating-text">({plumber.totalReviews || 0} reviews)</span>
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
                      <Link to="/booking" className="btn-primary book-sm-btn">Book Now</Link>
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
