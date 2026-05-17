import api from './api';

/**
 * REST fallback for fetching chat history.
 * Used when socket reconnects and needs to resync.
 */
export const getChatHistory = async (bookingId) => {
  const res = await api.get(`/api/chat/${bookingId}`);
  return res.data;
};

/**
 * Delete a message for the current user only ("delete for me").
 */
export const deleteMessageForMe = async (bookingId, messageId) => {
  const res = await api.delete(`/api/chat/${bookingId}/messages/${messageId}`);
  return res.data;
};

/**
 * Delete a message for all participants ("delete for everyone").
 * Only the original sender is authorized to call this.
 */
export const deleteMessageForEveryone = async (bookingId, messageId) => {
  const res = await api.delete(`/api/chat/${bookingId}/messages/${messageId}/everyone`);
  return res.data;
};

/**
 * Clear all chat history for the current user.
 * Messages remain visible to the other participant.
 */
export const clearChat = async (bookingId) => {
  const res = await api.post(`/api/chat/${bookingId}/clear`);
  return res.data;
};
