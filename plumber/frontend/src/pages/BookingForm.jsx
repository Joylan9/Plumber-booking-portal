import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './BookingForm.css';

const BookingForm = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [plumbers, setPlumbers] = useState([]);
  const [formData, setFormData] = useState({
    plumberId: '',
    serviceType: '',
    date: '',
    time: '',
    address: '',
    issueDescription: ''
  });
  
  const [error, setError] = useState(null);

  // If not logged in, theoretically we could prompt or redirect
  // For now, let's allow viewing but fail on submit if no token exists natively in AuthContext
  
  useEffect(() => {
    // Fetch available plumbers dynamically
    const fetchPlumbers = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/plumbers');
        if (data.success) {
          setPlumbers(data.data);
        }
      } catch (err) {
        console.error("Error fetching plumbers", err);
      }
    };
    fetchPlumbers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || user.role !== 'customer') {
      setError("Please log in as a Customer to book a service.");
      return;
    }
    
    try {
      // In production, grab the stored JWT token natively
      // Since we didn't explicitly implement Axios interceptors yet, we manually attach it if stored
      const localUser = JSON.parse(localStorage.getItem('user'));
      
      const config = {
        headers: { Authorization: `Bearer ${localUser?.token}` }
      };

      const { data } = await axios.post('http://localhost:5000/api/bookings', formData, config);
      
      if (data.success) {
        navigate('/confirmation', { state: { booking: data.data } });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="booking-page">
      <div className="booking-container">
        <div className="booking-header">
          <h2>Schedule a Service</h2>
          <p>Fill out the details below to lock in your professional plumber instantly.</p>
        </div>

        {error && <div className="booking-error">{error}</div>}

        <form onSubmit={handleSubmit} className="booking-form card-panel">
          <div className="form-row">
            <div className="form-group">
              <label>Service Type</label>
              <select name="serviceType" className="premium-input" value={formData.serviceType} onChange={handleChange} required>
                <option value="">Select Service...</option>
                <option value="Leak Repair">Leak Repair</option>
                <option value="Pipe Installation">Pipe Installation</option>
                <option value="Drain Cleaning">Drain Cleaning</option>
                <option value="General Maintenance">General Maintenance</option>
              </select>
            </div>

            <div className="form-group">
              <label>Select Plumber</label>
              <select name="plumberId" className="premium-input" value={formData.plumberId} onChange={handleChange} required>
                <option value="">Choose an expert...</option>
                {plumbers.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} - ⭐ {p.rating} ({p.experience} yrs)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input type="date" name="date" className="premium-input" value={formData.date} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Preferred Time</label>
              <input type="time" name="time" className="premium-input" value={formData.time} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Service Address</label>
            <input type="text" name="address" className="premium-input" placeholder="123 Main St, City, State, ZIP" value={formData.address} onChange={handleChange} required />
          </div>

          <div className="form-group full-width">
            <label>Issue Description</label>
            <textarea name="issueDescription" className="premium-input" rows="4" placeholder="Describe the issue in detail..." value={formData.issueDescription} onChange={handleChange} required></textarea>
          </div>

          <button type="submit" className="btn-primary submit-booking-btn">Secure Book Now</button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
