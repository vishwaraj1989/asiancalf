const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const returnController = require('../controllers/returnController');
const { body, param } = require('express-validator');
const validate = require('../middleware/validateRequest');

router.post('/', protect, [body('order').isMongoId(), body('items').isArray()], validate, returnController.requestReturn);

router.get('/', protect, authorize('admin'), returnController.listReturns);
router.put('/:id/status', protect, authorize('admin'), [param('id').isMongoId(), body('status').notEmpty()], validate, returnController.updateReturnStatus);

module.exports = router;
