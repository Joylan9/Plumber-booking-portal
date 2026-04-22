const express = require('express');
const { getCategories, createCategory } = require('../controllers/categoryController');
const { protectRoute, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(getCategories)
  .post(protectRoute, authorizeRoles('admin'), createCategory);

module.exports = router;
