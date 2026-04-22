import api from './api';

export const createBooking = async (data) => {
  const res = await api.post('/api/bookings', data);
  return res.data;
};

export const getMyBookings = async () => {
  const res = await api.get('/api/bookings/my-bookings');
  return res.data;
};

export const updateBookingStatus = async (id, status) => {
  const res = await api.put(`/api/bookings/${id}/status`, { status });
  return res.data;
};

export const getBookingById = async (id) => {
  const res = await api.get(`/api/bookings/${id}`);
  return res.data;
};
