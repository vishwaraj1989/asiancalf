const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/dashboard', adminController.dashboard);
router.get('/customers', adminController.listCustomers);

module.exports = router;
