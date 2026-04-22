import api from './api';

export const getUsers = async (role = '', page = 1, limit = 10) => {
  const url = role 
    ? `/api/admin/users?role=${role}&page=${page}&limit=${limit}` 
    : `/api/admin/users?page=${page}&limit=${limit}`;
  const res = await api.get(url);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await api.delete(`/api/admin/users/${id}`);
  return res.data;
};

export const getBookings = async (page = 1, limit = 10) => {
  const res = await api.get(`/api/admin/bookings?page=${page}&limit=${limit}`);
  return res.data;
};

export const deleteBooking = async (id) => {
  const res = await api.delete(`/api/admin/bookings/${id}`);
  return res.data;
};

export const getReviews = async (page = 1, limit = 10) => {
  const res = await api.get(`/api/admin/reviews?page=${page}&limit=${limit}`);
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
