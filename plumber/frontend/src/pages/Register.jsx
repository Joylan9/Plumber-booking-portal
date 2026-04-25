import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { register as registerApi } from '../services/authService';
import { getCategories } from '../services/categoryService';
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

const UserIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const WrenchIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const Register = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    phone: '',
    area: '',
    bio: '',
    experience: '',
    hourlyRate: '',
    services: []
  });
  
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category data from API (no longer used for the UI directly, but keeping state to avoid breaking existing logic if any)
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  // New states for the dropdown and custom input
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [customServicesInput, setCustomServicesInput] = useState('');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch categories when role is plumber
  useEffect(() => {
    if (formData.role === 'plumber' && categories.length === 0) {
      setCategoriesLoading(true);
      setCategoriesError(null);
      getCategories()
        .then((data) => {
          const list = data.data || data || [];
          setCategories(Array.isArray(list) ? list : []);
        })
        .catch(() => {
          setCategoriesError('Could not load services');
        })
        .finally(() => setCategoriesLoading(false));
    }
  }, [formData.role]);

  // Evaluate password strength dynamically
  useEffect(() => {
    let strength = 0;
    if (formData.password.length >= 6) strength += 25;
    if (formData.password.length >= 10) strength += 25;
    if (/[A-Z]/.test(formData.password)) strength += 25;
    if (/[0-9]/.test(formData.password) || /[^A-Za-z0-9]/.test(formData.password)) strength += 25;
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleService = (serviceName) => {
    setFormData((prev) => {
      const current = prev.services;
      if (current.includes(serviceName)) {
        return { ...prev, services: current.filter((s) => s !== serviceName) };
      }
      return { ...prev, services: [...current, serviceName] };
    });
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError(null);
    if (step === 1) {
      if (formData.password.length < 6) {
        return setError("Password must be at least 6 characters.");
      }
      setStep(2);
    } else if (step === 2) {
      if (formData.role === 'customer') {
        submitRegistration();
      } else {
        setStep(3);
      }
    } else if (step === 3) {
      if (!formData.experience || !formData.hourlyRate || formData.services.length === 0) {
        return setError("Experience, Hourly Rate, and at least one Service are required.");
      }
      submitRegistration();
    }
  };

  const submitRegistration = async () => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Format payload correctly based on role
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };

      if (formData.role === 'plumber') {
        payload.phone = formData.phone;
        payload.area = formData.area;
        payload.bio = formData.bio;
        payload.experience = Number(formData.experience);
        payload.hourlyRate = Number(formData.hourlyRate);
        payload.services = formData.services;
      }

      const data = await registerApi(payload);

      if (data.success) {
        login(data.data);
        setTimeout(() => navigate('/dashboard'), 600);
      }
    } catch (err) {
      setError(err.message || 'Registration failed processing form');
      setIsSubmitting(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  // Derive flat service names from categories for the checkbox grid
  const serviceOptions = categories.flatMap((cat) =>
    cat.services ? cat.services.map((s) => (typeof s === 'string' ? s : s.name)) : [cat.name]
  );

  const strengthColor = (threshold) => {
    if (passwordStrength >= threshold) {
      return passwordStrength === 100 ? 'var(--confirm-green)' : 'var(--amber-cta)';
    }
    return '#e0e0e0';
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
          <div className="register-steps">
            <div className="step-bar" style={{ background: step >= 1 ? 'var(--confirm-green)' : '#e0e0e0' }} />
            <div className="step-bar" style={{ background: step >= 2 ? 'var(--confirm-green)' : '#e0e0e0' }} />
            <div className="step-bar" style={{ background: step >= 3 ? 'var(--confirm-green)' : formData.role === 'customer' ? 'transparent' : '#e0e0e0' }} />
          </div>
          
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                key="err"
                className="auth-error"
                initial={{ opacity: 0, y: -15, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleNextStep} className="auth-form">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                  <p className="auth-subtitle">Step 1: Core Credentials</p>
                  
                  <div className="form-group">
                    <label>Full Name</label>
                    <div className="input-wrapper">
                      <input type="text" name="name" className="premium-input animated-underline" value={formData.name} onChange={handleChange} required/>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                      <input type="email" name="email" className="premium-input animated-underline" value={formData.email} onChange={handleChange} required/>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <div className="input-wrapper" style={{ position: 'relative' }}>
                      <input type={showPassword ? "text" : "password"} name="password" className="premium-input animated-underline" value={formData.password} onChange={handleChange} required style={{ paddingRight: '40px' }}/>
                      <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        <EyeIcon show={showPassword} />
                      </div>
                    </div>
                    {/* Password Strength Indicator */}
                    <div className="strength-bar">
                      <div className="strength-segment" style={{ background: strengthColor(25) }}/>
                      <div className="strength-segment" style={{ background: strengthColor(50) }}/>
                      <div className="strength-segment" style={{ background: strengthColor(75) }}/>
                      <div className="strength-segment" style={{ background: strengthColor(100) }}/>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                  <p className="auth-subtitle">Step 2: Platform Identity</p>
                  <label className="form-group" style={{ display: 'block', marginBottom: '12px' }}>I am looking to...</label>
                  
                  <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                    <div 
                      onClick={() => setFormData({...formData, role: 'customer'})}
                      className={`role-card ${formData.role === 'customer' ? 'selected' : ''}`}
                    >
                      <div className="role-card-icon"><UserIcon/></div>
                      <div>
                        <h4 className="role-card-title">Book Services</h4>
                        <p className="role-card-desc">I need to hire a professional plumber</p>
                      </div>
                    </div>

                    <div 
                      onClick={() => setFormData({...formData, role: 'plumber'})}
                      className={`role-card ${formData.role === 'plumber' ? 'selected' : ''}`}
                    >
                      <div className="role-card-icon"><WrenchIcon/></div>
                      <div>
                        <h4 className="role-card-title">Provide Services</h4>
                        <p className="role-card-desc">I am a plumber accepting clients</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                  <p className="auth-subtitle">Step 3: Professional Setup</p>

                  <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Hourly Rate ($)</label>
                      <div className="input-wrapper"><input type="number" name="hourlyRate" className="premium-input animated-underline" value={formData.hourlyRate} onChange={handleChange} placeholder="e.g. 50" required/></div>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Experience (Years)</label>
                      <div className="input-wrapper"><input type="number" name="experience" className="premium-input animated-underline" value={formData.experience} onChange={handleChange} placeholder="e.g. 5" required/></div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Services</label>
                    <div className="input-wrapper" style={{ marginBottom: '10px' }}>
                      <select 
                        className="premium-input animated-underline"
                        value={selectedServiceType}
                        onChange={(e) => {
                          setSelectedServiceType(e.target.value);
                          if (e.target.value !== 'Other') {
                            setFormData({...formData, services: [e.target.value]});
                          } else {
                            setFormData({...formData, services: customServicesInput.split(',').map(s => s.trim()).filter(Boolean)});
                          }
                        }}
                        required
                        style={{ appearance: 'auto' }}
                      >
                        <option value="" disabled>Select primary service</option>
                        <option value="Drain Cleaning">Drain Cleaning</option>
                        <option value="Pipe Installation">Pipe Installation</option>
                        <option value="Water Heater Repair">Water Heater Repair</option>
                        <option value="Leak Detection">Leak Detection</option>
                        <option value="General Plumbing">General Plumbing</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {selectedServiceType === 'Other' && (
                      <div className="input-wrapper">
                        <input
                          type="text"
                          className="premium-input animated-underline"
                          placeholder="Type your services (comma separated)"
                          value={customServicesInput}
                          onChange={(e) => {
                            setCustomServicesInput(e.target.value);
                            setFormData({...formData, services: e.target.value.split(',').map(s => s.trim()).filter(Boolean)});
                          }}
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Professional Bio (Optional)</label>
                    <div className="input-wrapper">
                      <textarea name="bio" className="premium-input animated-underline" value={formData.bio} onChange={handleChange} rows="2" style={{ resize: 'none' }} placeholder="Tell clients about yourself..."></textarea>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="auth-actions-row">
              {step > 1 && (
                <button type="button" onClick={() => setStep(step - 1)} className="btn-outline">
                  Back
                </button>
              )}
              
              <motion.button 
                type="submit" 
                className="btn-primary submit-btn"
                style={{ flex: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                   <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }}/>
                ) : (
                  step === 2 && formData.role === 'customer' ? 'Create Account' : 
                  step === 3 ? 'Finalize Professional Account' : 
                  'Next Step'
                )}
              </motion.button>
            </div>
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
