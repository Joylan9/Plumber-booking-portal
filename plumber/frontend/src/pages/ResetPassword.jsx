import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './Auth.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError("Passwords do not actively match.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data } = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, { password });

      if (data.success) {
        // Automatically redirect to log in securely
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset structurally failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container split-layout">
      {/* Left Animated Panel */}
      <motion.div 
        className="auth-hero-panel"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="hero-branding">
          <h2>Authentication Recovery</h2>
          <p>Securely reset your credentials globally.</p>
        </div>
      </motion.div>

      {/* Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <h2 className="auth-title">Set New Password</h2>
          <p className="auth-subtitle">Provide your newly requested secure parameters</p>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                className="auth-error"
                initial={{ opacity: 0, y: -15, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={submitHandler} className="auth-form">
            <div className="form-group">
              <label>New Password</label>
              <div className="input-wrapper">
                <input 
                  type="password" 
                  className="premium-input animated-underline" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="6"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <input 
                  type="password" 
                  className="premium-input animated-underline" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength="6"
                />
              </div>
            </div>

            <motion.button 
              type="submit" 
              className="btn-primary submit-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                 <motion.div 
                   animate={{ rotate: 360 }} 
                   transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                   style={{ width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }}
                 />
              ) : 'Confirm Reset Password'}
            </motion.button>
          </form>

          <div className="auth-footer" style={{ marginTop: '30px' }}>
            <Link to="/login">Cancel & Return</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
