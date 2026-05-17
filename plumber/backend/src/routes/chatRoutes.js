const express = require('express');
const {
  getChatHistory,
  deleteMessageForMe,
  deleteMessageForEveryone,
  clearChat,
} = require('../controllers/chatController');
const { protectRoute } = require('../middleware/authMiddleware');

const router = express.Router();

// GET    /api/chat/:bookingId                              — Chat history
router.get('/:bookingId', protectRoute, getChatHistory);

// DELETE /api/chat/:bookingId/messages/:messageId          — Delete for me
router.delete('/:bookingId/messages/:messageId', protectRoute, deleteMessageForMe);

// DELETE /api/chat/:bookingId/messages/:messageId/everyone — Delete for everyone
router.delete('/:bookingId/messages/:messageId/everyone', protectRoute, deleteMessageForEveryone);

// POST   /api/chat/:bookingId/clear                       — Clear chat for me
router.post('/:bookingId/clear', protectRoute, clearChat);

module.exports = router;
