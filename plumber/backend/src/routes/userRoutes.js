const express = require('express');
const { updateProfile, uploadAvatar } = require('../controllers/userController');
const { protectRoute } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.put('/profile', protectRoute, updateProfile);
router.post('/upload-avatar', protectRoute, upload.single('avatar'), uploadAvatar);

module.exports = router;
