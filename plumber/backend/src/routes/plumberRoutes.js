const express = require('express');
const { getPlumbers, getPlumberById } = require('../controllers/plumberController');

const router = express.Router();

router.route('/').get(getPlumbers);
router.route('/:id').get(getPlumberById);

module.exports = router;
