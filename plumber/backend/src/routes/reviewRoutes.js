const express = require('express');
const { createReview, getPlumberReviews, getRecentReviews } = require('../controllers/reviewController');
const { protectRoute, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/recent', getRecentReviews);
router.post('/', protectRoute, authorizeRoles('customer'), createReview);
router.get('/plumber/:plumberId', getPlumberReviews);

module.exports = router;
