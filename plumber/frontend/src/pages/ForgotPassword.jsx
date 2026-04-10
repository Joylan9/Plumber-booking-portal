import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsSubmitting(true);
    
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setIsSuccess(true);
      setStatusMsg(data.message);
      setIsSubmitting(false);
    } catch (err) {
      setIsSuccess(false);
      setStatusMsg(err.response?.data?.message || 'Failed to process request');
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
          <h2 className="auth-title">Forgot Password</h2>
          <p className="auth-subtitle">Enter your registered email to receive a reset link</p>
          
          <AnimatePresence>
            {statusMsg && (
              <motion.div 
                className={isSuccess ? "auth-success" : "auth-error"}
                initial={{ opacity: 0, y: -15, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                style={isSuccess ? { background: '#E8F5E9', color: '#2E7D32', border: '1px solid #4CAF50', padding: '12px', borderRadius: '6px', marginBottom: '24px', fontSize: '0.9rem' } : {}}
              >
                {statusMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {!isSuccess ? (
            <form onSubmit={submitHandler} className="auth-form">
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <input 
                    type="email" 
                    className="premium-input animated-underline" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
                ) : 'Send Reset Link'}
              </motion.button>
            </form>
          ) : (
            <div className="auth-form" style={{ marginTop: '20px' }}>
              <motion.div 
                animate={{ scale: [0.8, 1.1, 1] }} 
                transition={{ duration: 0.5 }}
                style={{ fontSize: '3rem', color: '#4CAF50', marginBottom: '20px' }}
              >
                ✓
              </motion.div>
              <p>The reset link has been dispatched. Please check your inbox and click the link to securely reset your password.</p>
            </div>
          )}

          <div className="auth-footer" style={{ marginTop: '30px' }}>
            Remembered your password? <Link to="/login">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
