const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllBookings,
  getBookingById,
  deleteBooking,
  getAllReviews,
  deleteReview,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/adminController');

const router = express.Router();

// Apply protect and adminOnly middleware to all routes in this router
router.use(protect);
router.use(adminOnly);

// User Management
router.route('/users')
  .get(getAllUsers);
router.route('/users/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

// Booking Management
router.route('/bookings')
  .get(getAllBookings);
router.route('/bookings/:id')
  .get(getBookingById)
  .delete(deleteBooking);

// Review Management
router.route('/reviews')
  .get(getAllReviews);
router.route('/reviews/:id')
  .delete(deleteReview);

// Category Management
router.route('/categories')
  .get(getAllCategories)
  .post(createCategory);
router.route('/categories/:id')
  .put(updateCategory)
  .delete(deleteCategory);

module.exports = router;
