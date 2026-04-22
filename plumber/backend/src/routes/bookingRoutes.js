const express = require('express');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
} = require('../controllers/bookingController');
const { protectRoute, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protectRoute, authorizeRoles('customer', 'admin'), createBooking)
  .get(protectRoute, getMyBookings);

router.get('/my-bookings', protectRoute, getMyBookings);
router.route('/:id/status')
  .put(protectRoute, authorizeRoles('plumber', 'admin'), updateBookingStatus)
  .patch(protectRoute, authorizeRoles('plumber', 'admin'), updateBookingStatus);
router.get('/:id', protectRoute, getBookingById);

module.exports = router;
