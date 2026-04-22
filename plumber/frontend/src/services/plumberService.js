import api from './api';

export const getPlumbers = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.area) params.append('area', filters.area);
  if (filters.service) params.append('service', filters.service);
  const res = await api.get(`/api/plumbers?${params.toString()}`);
  return res.data;
};

export const getPlumberById = async (id) => {
  const res = await api.get(`/api/plumbers/${id}`);
  return res.data;
};
