const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validateRequest');

router.get('/', categoryController.listCategories);
router.get('/:id', [param('id').isMongoId()], validate, categoryController.getCategory);

router.post('/', protect, authorize('admin'), [body('name').notEmpty(), body('slug').notEmpty()], validate, categoryController.createCategory);
router.put('/:id', protect, authorize('admin'), [param('id').isMongoId()], validate, categoryController.updateCategory);
router.delete('/:id', protect, authorize('admin'), [param('id').isMongoId()], validate, categoryController.deleteCategory);

module.exports = router;
