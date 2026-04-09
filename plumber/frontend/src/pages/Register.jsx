import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  });
  
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/register', formData);

      if (data.success) {
        login(data.data);
        setTimeout(() => navigate('/dashboard'), 600);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
      >
        <div className="hero-branding">
          <h2>Join FlowMatch</h2>
          <p>The premium network for home services.</p>
        </div>
      </motion.div>

      {/* Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join us to book or provide services</p>
          
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
              <label>Full Name</label>
              <input 
                type="text" 
                name="name"
                className="premium-input animated-underline" 
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email"
                className="premium-input animated-underline" 
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password"
                className="premium-input animated-underline" 
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label>I am a...</label>
              <select 
                name="role" 
                className="premium-input animated-underline"
                value={formData.role} 
                onChange={handleChange}
              >
                <option value="customer">Customer (Looking for Plumbers)</option>
                <option value="plumber">Plumber (Offering Services)</option>
              </select>
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
              ) : 'Create Your Account'}
            </motion.button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Log In Instead</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
