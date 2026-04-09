import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      if (data.success) {
        login(data.data);
        // Morph button success before redirect could go here natively
        setTimeout(() => navigate('/dashboard'), 600);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
          <h2>FlowMatch Portal</h2>
          <p>Secure pipeline access.</p>
        </div>
      </motion.div>

      {/* Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Login to manage your bookings</p>
          
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
              <label>Email Address</label>
              <div className="input-wrapper">
                <input 
                  type="email" 
                  className="premium-input animated-underline" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <motion.div className="focus-line" layoutId="focus-line"></motion.div>
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <input 
                  type="password" 
                  className="premium-input animated-underline" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              ) : 'Sign In To Proceed'}
            </motion.button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Sign Up Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
