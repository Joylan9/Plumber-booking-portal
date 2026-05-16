const express = require('express');
const { getChatHistory } = require('../controllers/chatController');
const { protectRoute } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:bookingId', protectRoute, getChatHistory);

module.exports = router;
