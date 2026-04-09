import { useLocation, Link, Navigate } from 'react-router-dom';
import './Confirmation.css';

const Confirmation = () => {
  const location = useLocation();
  const booking = location.state?.booking;

  if (!booking) {
    return <Navigate to="/" />;
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        
        <div className="success-header">
          <div className="success-icon">✓</div>
          <h2>Booking Confirmed!</h2>
          <p>Your request has been securely processed and sent to your selected professional.</p>
        </div>

        <div className="card-panel summary-card">
          <h3 className="summary-title">Booking Details</h3>
          
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Status:</span>
              <span className="value status-pill">{booking.status.toUpperCase()}</span>
            </div>
            
            <div className="summary-item">
              <span className="label">Date & Time:</span>
              <span className="value">{new Date(booking.date).toLocaleDateString()} at {booking.time}</span>
            </div>
            
            <div className="summary-item">
              <span className="label">Service Location:</span>
              <span className="value location">{booking.address}</span>
            </div>
            
            <div className="summary-item">
              <span className="label">Reference ID:</span>
              <span className="value ref-id">{booking._id}</span>
            </div>
          </div>
        </div>

        <div className="card-panel map-placeholder">
          <div className="map-overlay">
            <span className="map-icon">🗺️</span>
            <p>Live Plumber Tracking Available Shortly</p>
          </div>
        </div>

        <div className="confirmation-actions">
          <Link to="/dashboard" className="btn-primary">View Dashboard</Link>
          <Link to="/" className="btn-outline">Return to Home</Link>
        </div>

      </div>
    </div>
  );
};

export default Confirmation;
