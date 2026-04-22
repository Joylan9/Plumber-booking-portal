import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">💧 Flow<span className="footer-highlight">Match</span></span>
          <p className="footer-tagline">Premium plumbing, on demand.</p>
        </div>
        <nav className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/plumbers">Find Plumbers</Link>
          <Link to="/register">Sign Up</Link>
          <Link to="/login">Login</Link>
        </nav>
        <p className="footer-copy">© {new Date().getFullYear()} FlowMatch. All rights reserved.</p>
      </div>
    </footer>
  );
}
