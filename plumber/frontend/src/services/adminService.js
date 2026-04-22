import api from './api';

// Users
export const getUsers = async (role = '') => {
  const url = role ? `/api/admin/users?role=${role}` : '/api/admin/users';
  const res = await api.get(url);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await api.delete(`/api/admin/users/${id}`);
  return res.data;
};

// Bookings
export const getBookings = async () => {
  const res = await api.get('/api/admin/bookings');
  return res.data;
};

export const deleteBooking = async (id) => {
  const res = await api.delete(`/api/admin/bookings/${id}`);
  return res.data;
};

// Reviews
export const getReviews = async () => {
  const res = await api.get('/api/admin/reviews');
  return res.data;
};

export const deleteReview = async (id) => {
  const res = await api.delete(`/api/admin/reviews/${id}`);
  return res.data;
};

// Categories
export const getCategories = async () => {
  const res = await api.get('/api/admin/categories');
  return res.data;
};

export const createCategory = async (data) => {
  const res = await api.post('/api/admin/categories', data);
  return res.data;
};

export const updateCategory = async (id, data) => {
  const res = await api.put(`/api/admin/categories/${id}`, data);
  return res.data;
};

export const deleteCategory = async (id) => {
  const res = await api.delete(`/api/admin/categories/${id}`);
  return res.data;
};
