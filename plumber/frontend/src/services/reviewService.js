import api from './api';

export const createReview = async (data) => {
  const res = await api.post('/api/reviews', data);
  return res.data;
};

export const getPlumberReviews = async (plumberId, page = 1) => {
  const res = await api.get(`/api/reviews/plumber/${plumberId}?page=${page}`);
  return res.data;
};
