import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { scrollY } = useScroll();
  const [isOpen, setIsOpen] = useState(false);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Map scroll value to specific CSS states
  const navBg = useTransform(
    scrollY, 
    [0, 80], 
    ["var(--steel-blue)", "rgba(10, 37, 64, 0.85)"]
  );
  
  const navBlur = useTransform(
    scrollY,
    [0, 80],
    ["blur(0px)", "blur(20px)"]
  );
  
  const navBorder = useTransform(
    scrollY,
    [0, 80],
    ["1px solid transparent", "1px solid rgba(255,255,255,0.08)"]
  );

  return (
    <motion.nav 
      className="main-navbar"
      style={{ 
        backgroundColor: navBg, 
        backdropFilter: navBlur,
        WebkitBackdropFilter: navBlur,
        borderBottom: navBorder 
      }}
    >
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <motion.span className="logo-icon" whileHover={{ rotate: 5 }}>💧</motion.span>
          <span className="logo-text">Flow<span className="highlight">Match</span></span>
        </Link>

        {/* Hamburger Icon */}
        <div className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? '✕' : '☰'}
        </div>
        
        <ul className={`nav-menu ${isOpen ? 'open' : ''}`}>
          <li className="nav-item">
            <Link to="/plumbers" className="nav-link">Find Plumbers</Link>
          </li>
          
          {user ? (
            <>
              {user.role === 'admin' && (
                <li className="nav-item">
                  <Link to="/admin" className="nav-link">Admin Panel</Link>
                </li>
              )}
              {user.role !== 'admin' && (
                <li className="nav-item">
                  <Link to="/dashboard" className="nav-link">Dashboard</Link>
                </li>
              )}
              <li className="nav-item">
                <Link to="/profile" className="nav-link user-pill glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
                  {user.profileImage ? (
                    <img src={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${user.profileImage}` : `http://localhost:5000${user.profileImage}`} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <span>👤</span>
                  )}
                  {user.role} | {user.name.split(' ')[0]}
                </Link>
              </li>
              <motion.li className="nav-item" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button className="btn-primary logout-btn nav-btn-sm" onClick={() => { logout(); }}>
                  Log Out
                </button>
              </motion.li>
            </>
          ) : (
            <li className="nav-item auth-buttons">
              <Link to="/login" className="nav-link">Log In</Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="nav-signup-wrap">
                 <button 
                   className="btn-primary nav-btn-sm nav-signup-btn"
                   onClick={() => { navigate('/register'); }}
                 >
                   Sign Up
                 </button>
              </motion.div>
            </li>
          )}
        </ul>
      </div>
    </motion.nav>
  );
};

export default Navbar;
