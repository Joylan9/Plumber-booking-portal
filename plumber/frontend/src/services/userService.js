import api from './api';

export const updateProfile = async (data) => {
  const res = await api.put('/api/users/profile', data);
  return res.data;
};

export const uploadAvatar = async (formData) => {
  const res = await api.post('/api/users/upload-avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};
