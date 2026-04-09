const express = require('express');
const { createBooking, getMyBookings, updateBookingStatus } = require('../controllers/bookingController');
const { protectRoute, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Only authenticated customers can natively book
router.post('/', protectRoute, authorizeRoles('customer', 'admin'), createBooking);

// Dynamically retrieves for the explicitly logged in user profile mapping
router.get('/my-bookings', protectRoute, getMyBookings);

// Only the assigned plumber (or admin) can change status
router.put('/:id/status', protectRoute, authorizeRoles('plumber', 'admin'), updateBookingStatus);

module.exports = router;
