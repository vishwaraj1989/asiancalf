const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');
const { param, body } = require('express-validator');
const validate = require('../middleware/validateRequest');

router.get('/product/:productId', protect, authorize('admin'), [param('productId').isMongoId()], validate, inventoryController.getInventory);
router.put('/product/:productId', protect, authorize('admin'), [
	param('productId').isMongoId(),
	body('currentStock').optional().isInt({ min: 0 }),
	body('reservedStock').optional().isInt({ min: 0 }),
	body('lowStockThreshold').optional().isInt({ min: 0 }),
], validate, inventoryController.updateInventory);
router.get('/low-stock', protect, authorize('admin'), inventoryController.listLowStock);

module.exports = router;
