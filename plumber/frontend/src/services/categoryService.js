import api from './api';

let cachedCategories = null;

export const getCategories = async () => {
  if (cachedCategories) return cachedCategories;
  const res = await api.get('/api/categories');
  cachedCategories = res.data;
  return cachedCategories;
};

export const clearCategoryCache = () => {
  cachedCategories = null;
};
