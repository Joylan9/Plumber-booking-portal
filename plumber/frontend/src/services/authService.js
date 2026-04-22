import api from './api';

export const register = async (data) => {
  const res = await api.post('/api/auth/register', data);
  return res.data;
};

export const login = async (data) => {
  const res = await api.post('/api/auth/login', data);
  return res.data;
};

export const forgotPassword = async (email) => {
  const res = await api.post('/api/auth/forgot-password', { email });
  return res.data;
};

export const resetPassword = async ({ email, otp, password }) => {
  const res = await api.post('/api/auth/reset-password', { email, otp, password });
  return res.data;
};
