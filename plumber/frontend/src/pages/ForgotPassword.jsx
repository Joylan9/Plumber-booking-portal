import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { forgotPassword, resetPassword } from '../services/authService';
import './Auth.css';

const EyeIcon = ({ show }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#888'}}>
    {show ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const ForgotPassword = () => {
  // Step 1 State
  const [email, setEmail] = useState('');
  
  // Step 2 State
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Global UI State
  const [step, setStep] = useState(1); // 1 = requesting OTP, 2 = verifying OTP, 3 = fully successful
  const [statusMsg, setStatusMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isError, setIsError] = useState(false);
  
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsError(false);
    setIsSubmitting(true);
    
    try {
      const data = await forgotPassword(email);
      setIsError(false);
      setStatusMsg(data.message);
      setStep(2); // Morph layout to OTP and new password step
    } catch (err) {
      setIsError(true);
      setStatusMsg(err.message || 'Failed to dispatch verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsError(false);
    setIsSubmitting(true);

    try {
      await resetPassword({ email, otp, password: newPassword });
      setIsError(false);
      setStatusMsg('Password securely reset! You may now login.');
      setStep(3); // Success Screen
    } catch (err) {
      setIsError(true);
      setStatusMsg(err.message || 'Invalid or expired Verification Code');
    } finally {
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
          <p className="auth-subtitle">
            {step === 1 && "Enter your registered email to receive an OTP code."}
            {step === 2 && "Enter the 6-digit OTP code sent to your email."}
            {step === 3 && "Secure recovery completion"}
          </p>
          
          <AnimatePresence mode="wait">
            {statusMsg && (
              <motion.div 
                key="msg"
                className={!isError ? "auth-success" : "auth-error"}
                initial={{ opacity: 0, y: -15, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                style={!isError ? { background: '#E8F5E9', color: 'var(--confirm-green)', border: '1px solid var(--confirm-green)', padding: '12px', borderRadius: '6px', marginBottom: '24px', fontSize: '0.9rem' } : {}}
              >
                {statusMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {step === 1 && (
            <motion.form 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onSubmit={handleSendOtp} 
              className="auth-form"
            >
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
                ) : 'Send OTP'}
              </motion.button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onSubmit={handleResetPassword} 
              className="auth-form"
            >
              <div className="form-group">
                <label>6-Digit Verification Code</label>
                <div className="input-wrapper">
                  <input 
                    type="text" 
                    className="premium-input animated-underline" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="e.g. 849301"
                    maxLength={6}
                    required
                    style={{ letterSpacing: '2px', fontSize: '1.2rem', fontWeight: 'bold' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>New Password</label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"}
                    className="premium-input animated-underline" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ paddingRight: '40px' }}
                  />
                  <div 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <EyeIcon show={showPassword} />
                  </div>
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
                ) : 'Reset Password'}
              </motion.button>
            </motion.form>
          )}

          {step === 3 && (
            <div className="auth-form" style={{ marginTop: '20px', textAlign: 'center' }}>
              <motion.div 
                animate={{ scale: [0.8, 1.1, 1] }} 
                transition={{ duration: 0.5 }}
                style={{ fontSize: '4rem', color: 'var(--confirm-green)', marginBottom: '20px', display: 'inline-block' }}
              >
                ✓
              </motion.div>
              <br/>
              <motion.button 
                onClick={() => navigate('/login')}
                className="btn-primary submit-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Proceed to Login
              </motion.button>
            </div>
          )}

          {step !== 3 && (
            <div className="auth-footer" style={{ marginTop: '30px' }}>
              Remembered your password? <Link to="/login">Back to Login</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
