import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../services/bookingService';
import { getPlumbers } from '../services/plumberService';
import { toast } from '../components/Toast';
import './BookingForm.css';

const TIME_SLOTS = [];
for (let h = 8; h <= 18; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 18) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const BookingForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [plumbers, setPlumbers] = useState([]);
  const [selectedPlumber, setSelectedPlumber] = useState(null);
  const [formData, setFormData] = useState({
    plumberId: searchParams.get('plumber') || '',
    date: '',
    time: '',
    address: '',
    issueDescription: ''
  });
  
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlumbers = async () => {
      try {
        const res = await getPlumbers();
        if (res.success) {
          setPlumbers(res.data);
          // If plumber pre-selected via query param, find it
          const preselected = searchParams.get('plumber');
          if (preselected) {
            const found = res.data.find(p => p._id === preselected);
            if (found) setSelectedPlumber(found);
          }
        }
      } catch (err) {
        console.error("Error fetching plumbers", err);
      }
    };
    fetchPlumbers();
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear field error on change
    if (errors[name]) setErrors({ ...errors, [name]: null });

    // Track selected plumber for cost preview
    if (name === 'plumberId') {
      const found = plumbers.find(p => p._id === value);
      setSelectedPlumber(found || null);
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.plumberId) errs.plumberId = 'Please select a plumber';
    if (!formData.date) errs.date = 'Date is required';
    if (!formData.time) errs.time = 'Time is required';
    if (!formData.address.trim()) errs.address = 'Address is required';
    if (!formData.issueDescription.trim()) errs.issueDescription = 'Please describe the issue';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const data = await createBooking(formData);
      
      if (data.success) {
        toast('Booking created successfully', 'success');
        navigate('/confirmation', { state: { booking: data.data } });
      }
    } catch (err) {
      setError(err.message || 'Booking failed');
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

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
              <label>Select Plumber</label>
              <select name="plumberId" className="premium-input" value={formData.plumberId} onChange={handleChange}>
                <option value="">Choose an expert...</option>
                {plumbers.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} — ${p.hourlyRate || 0}/hr ({p.experience || 0} yrs)
                  </option>
                ))}
              </select>
              {errors.plumberId && <span className="field-error">{errors.plumberId}</span>}
            </div>
          </div>

          {/* Cost preview */}
          {selectedPlumber && (
            <div className="cost-preview card-panel">
              <span>Estimated rate:</span>
              <strong>${selectedPlumber.hourlyRate || 0}/hr</strong>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input type="date" name="date" className="premium-input" value={formData.date} onChange={handleChange} min={todayStr} />
              {errors.date && <span className="field-error">{errors.date}</span>}
            </div>

            <div className="form-group">
              <label>Preferred Time</label>
              <select name="time" className="premium-input" value={formData.time} onChange={handleChange}>
                <option value="">Select time...</option>
                {TIME_SLOTS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.time && <span className="field-error">{errors.time}</span>}
            </div>
          </div>

          <div className="form-group full-width">
            <label>Service Address</label>
            <input type="text" name="address" className="premium-input" placeholder="123 Main St, City, State, ZIP" value={formData.address} onChange={handleChange} />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </div>

          <div className="form-group full-width">
            <label>Issue Description</label>
            <textarea name="issueDescription" className="premium-input" rows="4" placeholder="Describe the issue in detail..." value={formData.issueDescription} onChange={handleChange}></textarea>
            {errors.issueDescription && <span className="field-error">{errors.issueDescription}</span>}
          </div>

          <button type="submit" className="btn-primary submit-booking-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Secure Book Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
