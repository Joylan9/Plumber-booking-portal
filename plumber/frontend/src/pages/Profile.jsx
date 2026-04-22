import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, uploadAvatar } from '../services/userService';
import { nameInitial } from '../utils/format';
import { toast } from '../components/Toast';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    area: '',
    bio: '',
    experience: '',
    hourlyRate: '',
    services: ''
  });
  
  const [avatarFile, setAvatarFile] = useState(null);
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
        services: Array.isArray(user.services) ? user.services.join(', ') : ''
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
    
    // Create preview
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarFile(file);
    
    // Auto-upload
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
    if (user.role === 'plumber') {
      payload.experience = Number(payload.experience);
      payload.hourlyRate = Number(payload.hourlyRate);
      payload.services = payload.services.split(',').map(s => s.trim()).filter(Boolean);
    }
    
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
    <div className="profile-page">
      <div className="profile-header">
        <h1>Your Profile</h1>
        <p>Manage your account settings</p>
      </div>
      
      <div className="card-panel profile-card">
        <div className="avatar-section">
          <div className="avatar-preview">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile" />
            ) : (
              nameInitial(user.name)
            )}
          </div>
          <div className="avatar-upload-btn btn-outline">
            <span>Change Photo</span>
            <input type="file" accept="image/jpeg, image/png, image/jpg" onChange={handleAvatarChange} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form-grid">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" className="premium-input" value={formData.name} onChange={handleChange} required />
          </div>
          
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" name="phone" className="premium-input" value={formData.phone} onChange={handleChange} placeholder="(123) 456-7890" />
          </div>
          
          <div className="form-group">
            <label>Service Area / Location</label>
            <input type="text" name="area" className="premium-input" value={formData.area} onChange={handleChange} />
          </div>

          {user.role === 'plumber' && (
            <>
              <div className="form-group">
                <label>Experience (Years)</label>
                <input type="number" name="experience" className="premium-input" value={formData.experience} onChange={handleChange} min="0" required />
              </div>
              <div className="form-group">
                <label>Hourly Rate ($)</label>
                <input type="number" name="hourlyRate" className="premium-input" value={formData.hourlyRate} onChange={handleChange} min="0" required />
              </div>
              <div className="form-group full-width">
                <label>Services Offered (comma separated)</label>
                <input type="text" name="services" className="premium-input" value={formData.services} onChange={handleChange} placeholder="e.g. Pipe Repair, Water Heater, Drain Cleaning" required />
              </div>
            </>
          )}

          <div className="form-group full-width">
            <label>Bio</label>
            <textarea name="bio" className="premium-input" value={formData.bio} onChange={handleChange} rows="4" placeholder="Tell us a little about yourself..."></textarea>
          </div>

          <div className="full-width profile-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
