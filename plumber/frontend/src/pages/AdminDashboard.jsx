import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  getUsers, deleteUser, 
  getBookings, deleteBooking, 
  getReviews, deleteReview, 
  getCategories, createCategory, deleteCategory 
} from '../services/adminService';
import { formatDate, formatCurrency, clampRating } from '../utils/format';
import PageWrapper from '../components/PageWrapper';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import { toast } from '../components/Toast';
import './AdminDashboard.css';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [categories, setCategories] = useState([]);

  const [modal, setModal] = useState({ open: false, id: null, type: '', action: '' });
  
  const [newCatName, setNewCatName] = useState('');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [uRes, bRes, rRes, cRes] = await Promise.all([
        getUsers(), getBookings(), getReviews(), getCategories()
      ]);
      setUsers(uRes.data || []);
      setBookings(bRes.data || []);
      setReviews(rRes.data || []);
      setCategories(cRes.data || []);
    } catch (error) {
      toast('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  const handleDelete = async () => {
    const { id, type } = modal;
    setModal({ open: false, id: null, type: '', action: '' });
    
    try {
      if (type === 'user') {
        await deleteUser(id);
        setUsers(users.filter(u => u._id !== id));
      } else if (type === 'booking') {
        await deleteBooking(id);
        setBookings(bookings.filter(b => b._id !== id));
      } else if (type === 'review') {
        await deleteReview(id);
        setReviews(reviews.filter(r => r._id !== id));
      } else if (type === 'category') {
        await deleteCategory(id);
        setCategories(categories.filter(c => c._id !== id));
      }
      toast(`${type} deleted successfully`, 'success');
    } catch (err) {
      toast(err.message || `Failed to delete ${type}`, 'error');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await createCategory({ name: newCatName, isActive: true });
      setCategories([...categories, res.data]);
      setNewCatName('');
      toast('Category created', 'success');
    } catch (err) {
      toast(err.message || 'Failed to create category', 'error');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <PageWrapper>
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
        </div>

        <div className="admin-tabs">
          {['users', 'bookings', 'reviews', 'categories'].map(tab => (
            <button 
              key={tab} 
              className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <SkeletonLoader rows={5} type="stats" />
        ) : (
          <motion.div className="admin-section" initial="hidden" animate="visible" variants={fadeUp} key={activeTab}>
            
            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="admin-table-wrapper">
                {users.length === 0 ? <EmptyState title="No users found" message="System is currently empty." /> : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td><StatusBadge status={u.role} /></td>
                          <td>{formatDate(u.createdAt)}</td>
                          <td>
                            {u._id !== user._id && (
                              <button className="btn-danger" onClick={() => setModal({ open: true, id: u._id, type: 'user', action: 'Delete' })}>Delete</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === 'bookings' && (
              <div className="admin-table-wrapper">
                {bookings.length === 0 ? <EmptyState title="No bookings found" message="System is currently empty." /> : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Plumber</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b._id}>
                          <td>{formatDate(b.date)}</td>
                          <td>{b.customerId?.name || '—'}</td>
                          <td>{b.plumberId?.name || '—'}</td>
                          <td><StatusBadge status={b.status} /></td>
                          <td>
                            <button className="btn-danger" onClick={() => setModal({ open: true, id: b._id, type: 'booking', action: 'Delete' })}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div className="admin-table-wrapper">
                {reviews.length === 0 ? <EmptyState title="No reviews found" message="System is currently empty." /> : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Rating</th>
                        <th>Customer</th>
                        <th>Plumber</th>
                        <th>Comment</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map(r => (
                        <tr key={r._id}>
                          <td>★ {clampRating(r.rating)}</td>
                          <td>{r.customerId?.name || '—'}</td>
                          <td>{r.plumberId?.name || '—'}</td>
                          <td className="td-max">{r.comment || '—'}</td>
                          <td>
                            <button className="btn-danger" onClick={() => setModal({ open: true, id: r._id, type: 'review', action: 'Delete' })}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* CATEGORIES TAB */}
            {activeTab === 'categories' && (
              <div>
                <form className="category-form" onSubmit={handleCreateCategory}>
                  <input 
                    type="text" 
                    className="premium-input" 
                    placeholder="New category name..." 
                    value={newCatName} 
                    onChange={e => setNewCatName(e.target.value)} 
                    required 
                  />
                  <button type="submit" className="btn-primary">Add Category</button>
                </form>
                
                <div className="admin-table-wrapper">
                  {categories.length === 0 ? <EmptyState title="No categories found" message="Add a category to get started." /> : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map(c => (
                          <tr key={c._id}>
                            <td>{c.name}</td>
                            <td><StatusBadge status={c.isActive ? 'active' : 'inactive'} /></td>
                            <td>
                              <button className="btn-danger" onClick={() => setModal({ open: true, id: c._id, type: 'category', action: 'Delete' })}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

          </motion.div>
        )}

        <ConfirmModal
          isOpen={modal.open}
          title={`${modal.action} ${modal.type}?`}
          message={`Are you sure you want to delete this ${modal.type}? This action cannot be undone.`}
          confirmLabel="Delete"
          danger={true}
          onConfirm={handleDelete}
          onCancel={() => setModal({ open: false, id: null, type: '', action: '' })}
        />
      </div>
    </PageWrapper>
  );
}
