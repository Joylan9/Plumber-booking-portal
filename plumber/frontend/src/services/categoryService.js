import api from './api';

let cachedCategories = null;

export const getCategories = async () => {
  if (cachedCategories) return cachedCategories;
  try {
    const res = await api.get('/api/categories');
    cachedCategories = res.data?.data || res.data || [];
    return cachedCategories;
  } catch (error) {
    console.warn('Failed to fetch categories, falling back to empty array', error);
    return [];
  }
};

export const clearCategoryCache = () => {
  cachedCategories = null;
};
