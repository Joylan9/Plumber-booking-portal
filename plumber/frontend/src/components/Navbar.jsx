import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { scrollY } = useScroll();

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
        
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/plumbers" className="nav-link">Find Plumbers</Link>
          </li>
          
          {user ? (
            <>
              <li className="nav-item">
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
              </li>
              <li className="nav-item">
                <div className="user-pill glass-panel">
                  {user.role} | {user.name.split(' ')[0]}
                </div>
              </li>
              <motion.li className="nav-item" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button className="btn-primary logout-btn" style={{ padding: "8px 16px", fontSize: "0.85rem" }} onClick={logout}>
                  Log Out
                </button>
              </motion.li>
            </>
          ) : (
            <li className="nav-item auth-buttons">
              <Link to="/login" className="nav-link">Log In</Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                 <button 
                   className="btn-primary"
                   style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                   onClick={() => navigate('/register')}
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
