import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './PlumberLayout.css';

const plumberLinks = [
  { to: '/dashboard', label: 'Jobs & Bookings', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { to: '/plumber-reviews', label: 'My Reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { to: '/profile', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

function SideIcon({ d }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function PlumberLayout({ children, title = 'Overview' }) {
  const { user } = useAuth();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'Jobs & Overview';
    if (location.pathname === '/plumber-reviews') return 'My Reviews';
    if (location.pathname === '/profile') return 'Profile Settings';
    return title;
  };

  return (
    <div className="plumber-theme pl-layout">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="pl-sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`pl-sidebar ${isExpanded ? 'expanded' : 'collapsed'} ${isMobileOpen ? 'mobile-open' : ''}`}
        initial={false}
        animate={{ width: isExpanded ? 260 : 72 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
      >
        <div className="pl-sidebar-header">
          <div className="pl-avatar">
            {user?.name?.charAt(0) || 'P'}
            <div className="pl-status-dot online"></div>
          </div>
          {isExpanded && (
            <motion.div className="pl-sidebar-user" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <p className="pl-user-name">{user?.name}</p>
              <p className="pl-user-role">Verified Plumber</p>
            </motion.div>
          )}
        </div>

        <nav className="pl-nav">
          {plumberLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/dashboard'}
              className={({ isActive }) => `pl-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="pl-nav-icon"><SideIcon d={link.icon} /></span>
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    className="pl-nav-label"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {link.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        <div className="pl-sidebar-footer">
          <button className="pl-toggle-btn" onClick={() => setIsExpanded(!isExpanded)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="pl-main-wrapper">
        {/* Top Header Bar */}
        <header className="pl-header">
          <div className="pl-header-left">
            <button className="pl-mobile-toggle" onClick={() => setIsMobileOpen(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="pl-page-title">{getPageTitle()}</h1>
          </div>

          <div className="pl-header-right">
            <div className="pl-header-time">
              {time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            
            {/* Availability Toggle Mock */}
            <div className="pl-availability">
              <span className="pl-avail-label">Online</span>
              <div className="pl-toggle-switch active"></div>
            </div>

            <button className="pl-icon-btn pl-bell">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="pl-badge">2</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="pl-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
