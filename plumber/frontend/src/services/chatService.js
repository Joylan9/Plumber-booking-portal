import api from './api';

/**
 * REST fallback for fetching chat history.
 * Used when socket reconnects and needs to resync.
 */
export const getChatHistory = async (bookingId) => {
  const res = await api.get(`/api/chat/${bookingId}`);
  return res.data;
};
