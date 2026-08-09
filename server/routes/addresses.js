const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const addressController = require('../controllers/addressController');
const { body, param } = require('express-validator');
const validate = require('../middleware/validateRequest');

router.use(protect);
router.get('/', addressController.listAddresses);
router.post('/', [body('fullName').notEmpty(), body('mobile').notEmpty(), body('city').notEmpty(), body('pinCode').notEmpty()], validate, addressController.addAddress);
router.put('/:id', [param('id').isMongoId()], validate, addressController.updateAddress);
router.delete('/:id', [param('id').isMongoId()], validate, addressController.deleteAddress);
router.post('/:id/default', [param('id').isMongoId()], validate, addressController.setDefault);

module.exports = router;
