import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { updateProfile, uploadAvatar } from '../services/userService';
import { nameInitial } from '../utils/format';
import { toast } from '../components/Toast';
import PlumberLayout from '../components/PlumberLayout';
import './PlumberProfileSettings.css';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } };

export default function PlumberProfileSettings() {
  const { user, updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    area: '',
    bio: '',
    experience: '',
    hourlyRate: '',
    services: '',
    availability: ''
  });
  
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        area: user.area || '',
        bio: user.bio || '',
        experience: user.experience || '',
        hourlyRate: user.hourlyRate || '',
        services: Array.isArray(user.services) ? user.services.join(', ') : '',
        availability: user.availability || 'Available'
      });
      if (user.profileImage) {
        setAvatarPreview(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${user.profileImage}` : `http://localhost:5000${user.profileImage}`);
      }
    }
  }, [user]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAvatarPreview(URL.createObjectURL(file));
    
    const data = new FormData();
    data.append('avatar', file);
    try {
      const res = await uploadAvatar(data);
      updateUser({ profileImage: res.data.profileImage });
      toast('Avatar updated successfully', 'success');
    } catch (err) {
      toast(err.message || 'Failed to upload avatar', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = { ...formData };
    payload.experience = Number(payload.experience);
    payload.hourlyRate = Number(payload.hourlyRate);
    payload.services = payload.services.split(',').map(s => s.trim()).filter(Boolean);
    
    try {
      const res = await updateProfile(payload);
      updateUser(res.data);
      toast('Profile updated successfully', 'success');
    } catch (err) {
      toast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <PlumberLayout title="Settings & Profile">
      <div className="pl-settings-container">
        
        {/* Avatar Section */}
        <motion.div className="pl-card pl-avatar-card" variants={fadeUp} initial="hidden" animate="visible">
          <div className="pl-avatar-large">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile" />
            ) : (
              nameInitial(user.name)
            )}
          </div>
          <div className="pl-avatar-actions">
            <h3>Profile Picture</h3>
            <p>JPG, GIF or PNG. Max size of 5MB.</p>
            <div className="pl-upload-wrapper">
              <button type="button" className="pl-btn pl-btn-outline">Upload New</button>
              <input type="file" accept="image/jpeg, image/png, image/jpg" onChange={handleAvatarChange} title="Upload Avatar" />
            </div>
          </div>
        </motion.div>

        {/* Main Settings Form */}
        <motion.form className="pl-settings-form" onSubmit={handleSubmit} variants={fadeUp} initial="hidden" animate="visible">
          
          {/* Section: Basic Info */}
          <div className="pl-form-section pl-card">
            <h4 className="pl-section-title">Personal Information</h4>
            <div className="pl-form-grid">
              <div className="pl-form-group">
                <label>Full Name</label>
                <input type="text" name="name" className="pl-input" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="pl-form-group">
                <label>Phone Number</label>
                <input type="tel" name="phone" className="pl-input" value={formData.phone} onChange={handleChange} placeholder="(123) 456-7890" />
              </div>
              <div className="pl-form-group">
                <label>Service Area / Location</label>
                <input type="text" name="area" className="pl-input" value={formData.area} onChange={handleChange} />
              </div>
              <div className="pl-form-group full-width">
                <label>Professional Bio</label>
                <textarea name="bio" className="pl-input" value={formData.bio} onChange={handleChange} rows="4" placeholder="Tell customers about yourself..."></textarea>
              </div>
            </div>
          </div>

          {/* Section: Professional Details */}
          <div className="pl-form-section pl-card">
            <h4 className="pl-section-title">Professional Profile</h4>
            <div className="pl-form-grid">
              <div className="pl-form-group">
                <label>Experience (Years)</label>
                <input type="number" name="experience" className="pl-input" value={formData.experience} onChange={handleChange} min="0" required />
              </div>
              <div className="pl-form-group">
                <label>Hourly Rate ($)</label>
                <div className="pl-input-icon-wrapper">
                  <span className="pl-input-icon">$</span>
                  <input type="number" name="hourlyRate" className="pl-input pl-input-padded" value={formData.hourlyRate} onChange={handleChange} min="0" required />
                </div>
              </div>
              <div className="pl-form-group full-width">
                <label>Services Offered</label>
                <input type="text" name="services" className="pl-input" value={formData.services} onChange={handleChange} placeholder="e.g. Pipe Repair, Water Heater, Drain Cleaning (Comma separated)" required />
                <span className="pl-form-hint">Separate multiple services with a comma.</span>
              </div>
            </div>
          </div>

          {/* Section: Availability */}
          <div className="pl-form-section pl-card">
            <h4 className="pl-section-title">Work Availability</h4>
            <div className="pl-form-grid">
              <div className="pl-form-group full-width">
                <label>Current Status</label>
                <select name="availability" className="pl-input pl-select" value={formData.availability} onChange={handleChange}>
                  <option value="Available">Available (Accepting new jobs)</option>
                  <option value="Busy">Busy (Currently on a job)</option>
                  <option value="Unavailable">Unavailable (Off duty)</option>
                </select>
                <span className="pl-form-hint">Customers can see your availability status on your profile.</span>
              </div>
            </div>
          </div>

          <div className="pl-form-actions">
            <button type="submit" className="pl-btn pl-btn-primary pl-btn-lg" disabled={loading}>
              {loading ? 'Saving Changes...' : 'Save All Changes'}
            </button>
          </div>

        </motion.form>
      </div>
    </PlumberLayout>
  );
}
